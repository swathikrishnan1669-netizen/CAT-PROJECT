from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
import numpy as np

class BaselineEngine:
    """
    Transparent Baseline Reconstruction Engine.
    
    1. Detects missing temperature readings in sensor streams.
    2. Uses Forward Fill (carrying last valid observation forward).
    3. Uses Linear Interpolation where both previous and next observations exist.
    4. Naive confidence score based solely on linear gap span.
    """

    @staticmethod
    def reconstruct_handover_series(
        readings: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        if not readings:
            return []

        df = pd.DataFrame(readings)
        if "timestamp" not in df.columns:
            return []

        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp").reset_index(drop=True)

        reconstructed_records = []
        last_known_temp: Optional[float] = None
        last_known_idx = None

        temps = df["temperature"].tolist()
        n = len(temps)

        for i in range(n):
            curr_temp = temps[i]
            curr_row = df.iloc[i]
            t = curr_row["timestamp"]

            if curr_temp is not None and not np.isnan(curr_temp):
                last_known_temp = curr_temp
                last_known_idx = i
                # Original reading is intact
                continue
            
            # Gap detected! We need to reconstruct
            # Find next known temp for potential interpolation
            next_known_temp = None
            next_known_idx = None
            for j in range(i + 1, n):
                if temps[j] is not None and not np.isnan(temps[j]):
                    next_known_temp = temps[j]
                    next_known_idx = j
                    break

            method = "BASELINE_FORWARD_FILL"
            reason = "Forward fill from previous known observation"
            recon_val = 4.0 # default cold-chain fallback if nothing known

            if last_known_temp is not None and next_known_temp is not None and next_known_idx is not None:
                # Linear interpolation
                method = "BASELINE_LINEAR"
                span = next_known_idx - last_known_idx
                step = i - last_known_idx
                recon_val = round(last_known_temp + (next_known_temp - last_known_temp) * (step / span), 2)
                reason = f"Linear interpolation between {last_known_temp:.1f}°C and {next_known_temp:.1f}°C ({span} min gap)"
                gap_span_minutes = span
            elif last_known_temp is not None:
                recon_val = round(last_known_temp, 2)
                reason = f"Forward fill from last observed {last_known_temp:.1f}°C"
                gap_span_minutes = (i - (last_known_idx if last_known_idx is not None else 0))
            elif next_known_temp is not None:
                method = "BASELINE_BACKWARD_FILL"
                recon_val = round(next_known_temp, 2)
                reason = f"Backward fill from upcoming observation {next_known_temp:.1f}°C"
                gap_span_minutes = 15
            else:
                gap_span_minutes = 30

            # Baseline confidence: naive linear decay
            conf = max(10.0, round(100.0 - (gap_span_minutes * 2.5), 1))

            reconstructed_records.append({
                "sensor_reading_id": int(curr_row.get("id")) if pd.notna(curr_row.get("id")) else None,
                "timestamp": t.to_pydatetime() if hasattr(t, "to_pydatetime") else t,
                "actual_value": curr_row.get("actual_value") if "actual_value" in curr_row else None,
                "reconstructed_value": recon_val,
                "method": method,
                "confidence": conf,
                "source": "RECONSTRUCTED",
                "reason": reason,
                "lower_bound": round(recon_val - 0.8, 2),
                "upper_bound": round(recon_val + 0.8, 2)
            })

        return reconstructed_records
