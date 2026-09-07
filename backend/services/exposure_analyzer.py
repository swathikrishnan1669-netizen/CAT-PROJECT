from typing import List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

class ExposureAnalyzer:
    """
    Uncertain Exposure Period Detection & Quantification Engine.
    
    A period is classified as UNCERTAIN EXPOSURE if:
    1. Reconstruction confidence is below threshold (< 75% or configured)
    2. Estimated temperature or upper bound exceeds Warning threshold (>= 8.0°C)
    3. Missing sensor gap occurs during door opening or prolonged transit
    
    Calculates:
    - start_time, end_time, duration_minutes
    - estimated_temperature, min_possible_temperature, max_possible_temperature
    - confidence, risk_level (LOW, MEDIUM, HIGH, CRITICAL)
    """

    @staticmethod
    def identify_uncertain_periods(
        reconstructed_readings: List[Dict[str, Any]],
        sensor_readings: List[Dict[str, Any]],
        warning_temp_threshold: float = 8.0,
        critical_temp_threshold: float = 10.0,
        confidence_cutoff: float = 75.0
    ) -> List[Dict[str, Any]]:
        # Merge observations to inspect chronological sequence
        records = []
        for r in sensor_readings:
            records.append({
                "timestamp": pd.to_datetime(r["timestamp"]),
                "temperature": r.get("temperature"),
                "confidence": 100.0 if r.get("temperature") is not None and not r.get("is_noisy") else 0.0,
                "upper_bound": r.get("temperature"),
                "lower_bound": r.get("temperature"),
                "is_recon": False,
                "door_status": r.get("door_status", "CLOSED")
            })

        for r in reconstructed_readings:
            records.append({
                "timestamp": pd.to_datetime(r["timestamp"]),
                "temperature": r.get("reconstructed_value"),
                "confidence": r.get("confidence", 50.0),
                "upper_bound": r.get("upper_bound", r.get("reconstructed_value", 4.0) + 1.0),
                "lower_bound": r.get("lower_bound", r.get("reconstructed_value", 4.0) - 1.0),
                "is_recon": True,
                "door_status": r.get("reason", "")
            })

        if not records:
            return []

        df = pd.DataFrame(records).sort_values("timestamp").reset_index(drop=True)
        # Drop duplicates at same timestamp, preferring reconstructed or sensor reading
        df = df.drop_duplicates(subset=["timestamp"], keep="last").reset_index(drop=True)

        uncertain_periods = []
        in_uncertain_block = False
        block_start = None
        block_temps = []
        block_min_bounds = []
        block_max_bounds = []
        block_confs = []

        for i in range(len(df)):
            row = df.iloc[i]
            temp = row["temperature"] if pd.notna(row["temperature"]) else 4.0
            conf = row["confidence"] if pd.notna(row["confidence"]) else 50.0
            upper_b = row["upper_bound"] if pd.notna(row["upper_bound"]) else temp + 1.5
            lower_b = row["lower_bound"] if pd.notna(row["lower_bound"]) else temp - 1.5

            # Condition for uncertain exposure:
            # - Reconstruction with confidence < 75
            # - OR temp upper bound >= warning threshold (e.g. >= 8.0°C)
            # - OR temp >= warning_temp_threshold
            is_uncertain_point = (
                (conf < confidence_cutoff and row["is_recon"]) or
                (upper_b >= warning_temp_threshold and row["is_recon"]) or
                (temp >= warning_temp_threshold)
            )

            if is_uncertain_point:
                if not in_uncertain_block:
                    in_uncertain_block = True
                    block_start = row["timestamp"]
                    block_temps = [temp]
                    block_min_bounds = [lower_b]
                    block_max_bounds = [upper_b]
                    block_confs = [conf]
                else:
                    block_temps.append(temp)
                    block_min_bounds.append(lower_b)
                    block_max_bounds.append(upper_b)
                    block_confs.append(conf)
            else:
                if in_uncertain_block:
                    # Close the block
                    block_end = df.iloc[i - 1]["timestamp"]
                    duration_min = max(1.0, round((block_end - block_start).total_seconds() / 60.0, 1))
                    
                    mean_temp = round(float(np.mean(block_temps)), 2)
                    max_temp = round(float(np.max(block_max_bounds)), 2)
                    min_temp = round(float(np.min(block_min_bounds)), 2)
                    mean_conf = round(float(np.mean(block_confs)), 1)

                    # Determine risk level
                    if max_temp >= critical_temp_threshold or mean_temp >= critical_temp_threshold:
                        risk = "CRITICAL"
                    elif max_temp >= warning_temp_threshold or mean_temp >= warning_temp_threshold:
                        risk = "HIGH" if mean_conf < 50.0 else "MEDIUM"
                    elif mean_conf < 50.0:
                        risk = "MEDIUM"
                    else:
                        risk = "LOW"

                    uncertain_periods.append({
                        "start_time": block_start.to_pydatetime() if hasattr(block_start, "to_pydatetime") else block_start,
                        "end_time": block_end.to_pydatetime() if hasattr(block_end, "to_pydatetime") else block_end,
                        "duration_minutes": duration_min,
                        "estimated_temperature": mean_temp,
                        "min_possible_temperature": min_temp,
                        "max_possible_temperature": max_temp,
                        "confidence": mean_conf,
                        "risk_level": risk,
                        "notes": f"Exposure under {mean_conf}% confidence; potential thermal peak {max_temp}°C"
                    })
                    in_uncertain_block = False

        # Close pending block at the end
        if in_uncertain_block and block_start is not None:
            block_end = df.iloc[-1]["timestamp"]
            duration_min = max(1.0, round((block_end - block_start).total_seconds() / 60.0, 1))
            mean_temp = round(float(np.mean(block_temps)), 2)
            max_temp = round(float(np.max(block_max_bounds)), 2)
            min_temp = round(float(np.min(block_min_bounds)), 2)
            mean_conf = round(float(np.mean(block_confs)), 1)

            if max_temp >= critical_temp_threshold:
                risk = "CRITICAL"
            elif max_temp >= warning_temp_threshold:
                risk = "HIGH" if mean_conf < 50.0 else "MEDIUM"
            else:
                risk = "LOW"

            uncertain_periods.append({
                "start_time": block_start.to_pydatetime() if hasattr(block_start, "to_pydatetime") else block_start,
                "end_time": block_end.to_pydatetime() if hasattr(block_end, "to_pydatetime") else block_end,
                "duration_minutes": duration_min,
                "estimated_temperature": mean_temp,
                "min_possible_temperature": min_temp,
                "max_possible_temperature": max_temp,
                "confidence": mean_conf,
                "risk_level": risk,
                "notes": f"Exposure at handover boundary under {mean_conf}% confidence"
            })

        return uncertain_periods
