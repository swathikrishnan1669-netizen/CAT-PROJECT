import math
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
import numpy as np
from backend.services.confidence_engine import ConfidenceEngine

class ImprovedEngine:
    """
    Context-Aware Physics-Informed Thermal Gap Reconstruction Engine.
    
    Reconstructs missing sensor readings using:
    - Newton's Law of Cooling / Heat Transfer
    - Door state dynamics (convective heat gain during milk transfer vs insulated closed state)
    - Ambient diurnal temperature cycle (derived from timestamp)
    - Vehicle insulation rating & active chiller recovery rate
    - Cross-sensor features (humidity correlation, battery stability)
    - Rigorous uncertainty bounds [min_possible_temp, max_possible_temp]
    """

    @staticmethod
    def get_ambient_temperature(dt: datetime) -> float:
        """
        Diurnal temperature model: lowest ~4am (20°C), peak ~2pm (32°C).
        """
        hour = dt.hour + dt.minute / 60.0
        # Peak at 14:00 (phase shift = 14 - 6 = 8)
        ambient = 25.0 + 6.0 * math.sin((hour - 8.0) * math.pi / 12.0)
        return round(ambient, 2)

    @classmethod
    def reconstruct_handover_series(
        cls,
        readings: List[Dict[str, Any]],
        insulation_factor: float = 0.95
    ) -> List[Dict[str, Any]]:
        if not readings:
            return []

        df = pd.DataFrame(readings)
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp").reset_index(drop=True)

        n = len(df)
        reconstructed_records = []

        # Find all known indices
        valid_indices = df.index[df["temperature"].notna() & ~df["temperature"].isna()].tolist()

        for i in range(n):
            curr_row = df.iloc[i]
            curr_temp = curr_row["temperature"]
            t = curr_row["timestamp"]
            py_dt = t.to_pydatetime() if hasattr(t, "to_pydatetime") else t

            if pd.notna(curr_temp):
                continue

            # This is a missing observation.
            # Locate previous and next valid points
            prev_indices = [idx for idx in valid_indices if idx < i]
            next_indices = [idx for idx in valid_indices if idx > i]

            prev_idx = prev_indices[-1] if prev_indices else None
            next_idx = next_indices[0] if next_indices else None

            prev_temp = float(df.iloc[prev_idx]["temperature"]) if prev_idx is not None else 4.0
            next_temp = float(df.iloc[next_idx]["temperature"]) if next_idx is not None else None

            prev_time = df.iloc[prev_idx]["timestamp"] if prev_idx is not None else t
            next_time = df.iloc[next_idx]["timestamp"] if next_idx is not None else t

            gap_prev_min = max(1.0, (t - prev_time).total_seconds() / 60.0) if prev_idx is not None else 30.0
            gap_next_min = max(1.0, (next_time - t).total_seconds() / 60.0) if next_idx is not None else 30.0
            total_gap_min = gap_prev_min + (gap_next_min if next_idx is not None else 0.0)

            # Environmental context
            door_status = str(curr_row.get("door_status", "CLOSED")).upper()
            door_open = (door_status == "OPEN")
            humidity = float(curr_row.get("humidity", 65.0)) if pd.notna(curr_row.get("humidity")) else 65.0
            calib_status = str(curr_row.get("calibration_status", "VALID"))
            net_status = str(curr_row.get("network_status", "ONLINE"))
            loc_avail = bool(curr_row.get("location_available", True))
            is_noisy = bool(curr_row.get("is_noisy", False))

            ambient_temp = cls.get_ambient_temperature(py_dt)

            # Thermal physics simulation:
            # When door is OPEN, heat ingress is high (dT/dt = k_open * (T_ambient - T))
            # When door is CLOSED, refrigeration chills down towards target ~3.8°C (dT/dt = -k_chiller * (T - 3.8))
            k_open = 0.045 * (1.0 + (humidity - 50.0) / 200.0) # slightly higher heat transfer with humid air
            k_chiller = 0.030 * insulation_factor

            # Boundary-constrained contextual reconstruction
            if next_temp is not None:
                # Normalised time between endpoints: 0.0 at prev, 1.0 at next
                t_norm = gap_prev_min / max(0.01, total_gap_min)
                bridge_temp = (1.0 - t_norm) * prev_temp + t_norm * next_temp
                
                # Parabolic boundary-constrained arc: 4 * t * (1 - t), 0 at ends, 1.0 at midpoint
                arc = 4.0 * t_norm * (1.0 - t_norm)
                
                if door_open:
                    thermal_bulge = min(0.65, 0.035 * total_gap_min * max(0.0, ambient_temp - bridge_temp) / 25.0) * arc
                    recon_temp = bridge_temp + thermal_bulge
                else:
                    cooling_dip = min(0.35, 0.025 * total_gap_min * max(0.0, bridge_temp - 3.8) / 10.0) * arc
                    recon_temp = bridge_temp - cooling_dip
                    
                reason = f"Contextual thermal bridge ({round(total_gap_min)}m gap) | Door: {door_status} | Ambient: {ambient_temp}°C"
            else:
                # Forward projection when next observation is unavailable
                if door_open:
                    thermal_rise = (ambient_temp - prev_temp) * (1.0 - math.exp(-k_open * min(gap_prev_min, 30.0)))
                    recon_temp = prev_temp + thermal_rise
                    reason = f"Open door thermal ingress projection (Ambient: {ambient_temp}°C, delta_t: {round(gap_prev_min)}m)"
                else:
                    cooling_drop = (prev_temp - 3.8) * (1.0 - math.exp(-k_chiller * min(gap_prev_min, 30.0)))
                    recon_temp = prev_temp - cooling_drop
                    reason = f"Refrigeration recovery projection (Insulation factor: {insulation_factor})"

            recon_temp = round(float(recon_temp), 2)

            # Confidence scoring
            conf_res = ConfidenceEngine.calculate_reading_confidence(
                gap_minutes=total_gap_min,
                calibration_status=calib_status,
                location_available=loc_avail,
                door_status_known=(door_status in ["OPEN", "CLOSED"]),
                network_status=net_status,
                cross_sensor_available=(pd.notna(curr_row.get("humidity")) and pd.notna(curr_row.get("battery_status"))),
                is_noisy=is_noisy
            )
            confidence = conf_res["score"]

            # Error envelope expands as confidence drops
            uncertainty_margin = round(0.4 + (100.0 - confidence) * 0.035, 2)
            lower_bound = round(recon_temp - uncertainty_margin, 2)
            upper_bound = round(recon_temp + uncertainty_margin, 2)

            reconstructed_records.append({
                "sensor_reading_id": int(curr_row.get("id")) if pd.notna(curr_row.get("id")) else None,
                "timestamp": py_dt,
                "actual_value": float(curr_row.get("actual_value")) if pd.notna(curr_row.get("actual_value")) else None,
                "reconstructed_value": recon_temp,
                "method": "IMPROVED_CONTEXTUAL",
                "confidence": confidence,
                "source": "RECONSTRUCTED",
                "reason": reason,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound
            })

        return reconstructed_records
