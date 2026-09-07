from typing import List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

class GapDetector:
    """
    Sensor Data Validation & Gap Detection Engine.
    
    1. Identifies missing timestamps (based on expected 60s cadence).
    2. Flags noisy spike readings (e.g. physical impossibilities, >5°C/min transient glitches).
    3. Detects delayed observations and network drops.
    4. Identifies telemetry dropouts (GPS unavailable, door sensor fault, calibration expired).
    """

    @staticmethod
    def analyze_stream(
        readings: List[Dict[str, Any]],
        expected_interval_sec: int = 60
    ) -> Dict[str, Any]:
        if not readings:
            return {
                "total_readings": 0,
                "missing_count": 0,
                "noisy_count": 0,
                "delayed_count": 0,
                "gaps": [],
                "telemetry_issues": []
            }

        df = pd.DataFrame(readings)
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp").reset_index(drop=True)

        gaps = []
        noisy_indices = []
        delayed_count = 0
        missing_count = 0
        telemetry_issues = []

        # Check for missing temperature readings in existing records
        missing_in_records = df["temperature"].isna().sum()
        missing_count += int(missing_in_records)

        # Check for time sequence gaps (> expected_interval_sec * 1.5)
        n = len(df)
        for i in range(n - 1):
            t_curr = df.iloc[i]["timestamp"]
            t_next = df.iloc[i + 1]["timestamp"]
            delta_sec = (t_next - t_curr).total_seconds()

            if delta_sec > (expected_interval_sec * 1.5):
                gap_duration_min = round(delta_sec / 60.0, 1)
                gaps.append({
                    "start_time": t_curr.to_pydatetime() if hasattr(t_curr, "to_pydatetime") else t_curr,
                    "end_time": t_next.to_pydatetime() if hasattr(t_next, "to_pydatetime") else t_next,
                    "duration_minutes": gap_duration_min,
                    "type": "TIMESTAMP_DROPOUT",
                    "reason": f"No telemetry received for {gap_duration_min} minutes"
                })
                # Estimated missing points
                missing_count += int(delta_sec // expected_interval_sec) - 1

        # Check for noise spikes:
        # 1. Absolute temperature outside valid bounds (-5°C to 40°C is physical limits, but dairy is 0-15°C)
        # 2. Delta > 4.5°C within 1-2 minutes without door opening
        for i in range(n):
            row = df.iloc[i]
            temp = row["temperature"]
            if pd.isna(temp):
                continue
            
            # Absolute anomaly check
            if temp > 22.0 or temp < -2.0:
                noisy_indices.append(i)
                continue

            # Sudden derivative jump check
            if i > 0 and pd.notna(df.iloc[i - 1]["temperature"]):
                prev_temp = df.iloc[i - 1]["temperature"]
                dt_min = max(0.5, (row["timestamp"] - df.iloc[i - 1]["timestamp"]).total_seconds() / 60.0)
                rate = abs(temp - prev_temp) / dt_min
                # If door is closed and rate > 3.0°C/min, it's an electrical noise spike
                door = str(row.get("door_status", "CLOSED")).upper()
                if door == "CLOSED" and rate > 3.0:
                    noisy_indices.append(i)

            # Telemetry flags
            if not row.get("location_available", True):
                telemetry_issues.append({"index": i, "issue": "GPS_UNAVAILABLE", "timestamp": row["timestamp"]})
            if str(row.get("calibration_status", "VALID")).upper() == "EXPIRED":
                telemetry_issues.append({"index": i, "issue": "CALIBRATION_EXPIRED", "timestamp": row["timestamp"]})
            if str(row.get("network_status", "ONLINE")).upper() == "OFFLINE":
                telemetry_issues.append({"index": i, "issue": "NETWORK_OFFLINE", "timestamp": row["timestamp"]})
            if bool(row.get("is_delayed", False)):
                delayed_count += 1

        return {
            "total_readings": n,
            "missing_count": missing_count,
            "noisy_indices": list(set(noisy_indices)),
            "noisy_count": len(set(noisy_indices)),
            "delayed_count": delayed_count,
            "gaps": gaps,
            "telemetry_issues": telemetry_issues
        }
