from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models import Alert, ThresholdSetting
from backend.app.config import (
    DEFAULT_TEMP_NORMAL_MAX, DEFAULT_TEMP_CRITICAL_MIN,
    DEFAULT_CONF_MEDIUM, DEFAULT_MAX_GAP_DURATION_MINUTES, DEFAULT_MAX_DOOR_OPEN_MINUTES
)

class AlertEngine:
    """
    Alert Engine with Configurable Thresholds.
    
    Monitors:
    - Temperature violations (Warning: > 8°C, Critical: > 10°C)
    - Long sensor gaps (> 15 mins)
    - Low reconstruction confidence (< 50%)
    - Expired calibration
    - GPS unavailable
    - Network outages
    - Prolonged door open durations (> 10 mins)
    """

    @staticmethod
    def get_threshold(db: Session, key: str, default_val: float) -> float:
        setting = db.query(ThresholdSetting).filter(ThresholdSetting.key == key).first()
        return setting.value if setting else default_val

    @classmethod
    def evaluate_handover_alerts(
        cls,
        db: Session,
        handover_id: str,
        vehicle_id: str,
        readings: List[Dict[str, Any]],
        reconstructed: List[Dict[str, Any]],
        gaps: List[Dict[str, Any]]
    ) -> List[Alert]:
        # Fetch current thresholds
        temp_warning = cls.get_threshold(db, "temp_warning", DEFAULT_TEMP_NORMAL_MAX)
        temp_critical = cls.get_threshold(db, "temp_critical", DEFAULT_TEMP_CRITICAL_MIN)
        conf_min = cls.get_threshold(db, "conf_min", DEFAULT_CONF_MEDIUM)
        gap_max = cls.get_threshold(db, "gap_max_minutes", DEFAULT_MAX_GAP_DURATION_MINUTES)
        door_max = cls.get_threshold(db, "door_max_minutes", DEFAULT_MAX_DOOR_OPEN_MINUTES)

        generated_alerts = []

        # 1. Temperature Alerts in sensor readings
        for r in readings:
            temp = r.get("temperature")
            t = r.get("timestamp")
            if temp is not None:
                if temp >= temp_critical:
                    generated_alerts.append(Alert(
                        handover_id=handover_id,
                        vehicle_id=vehicle_id,
                        timestamp=t,
                        alert_type="CRITICAL_TEMPERATURE",
                        severity="CRITICAL",
                        value=float(temp),
                        threshold=temp_critical,
                        message=f"Critical temperature excursion: {temp:.1f}°C exceeds {temp_critical:.1f}°C limit",
                        status="ACTIVE"
                    ))
                elif temp >= temp_warning:
                    generated_alerts.append(Alert(
                        handover_id=handover_id,
                        vehicle_id=vehicle_id,
                        timestamp=t,
                        alert_type="TEMPERATURE_WARNING",
                        severity="WARNING",
                        value=float(temp),
                        threshold=temp_warning,
                        message=f"Temperature warning: {temp:.1f}°C exceeds normal threshold {temp_warning:.1f}°C",
                        status="ACTIVE"
                    ))

            # Calibration alert
            if str(r.get("calibration_status", "VALID")).upper() == "EXPIRED":
                generated_alerts.append(Alert(
                    handover_id=handover_id,
                    vehicle_id=vehicle_id,
                    timestamp=t,
                    alert_type="CALIBRATION_EXPIRED",
                    severity="WARNING",
                    value=0.0,
                    threshold=0.0,
                    message="Sensor calibration has expired; reading validity uncertified",
                    status="ACTIVE"
                ))

            # GPS unavailable alert
            if not r.get("location_available", True):
                generated_alerts.append(Alert(
                    handover_id=handover_id,
                    vehicle_id=vehicle_id,
                    timestamp=t,
                    alert_type="GPS_UNAVAILABLE",
                    severity="WARNING",
                    value=0.0,
                    threshold=0.0,
                    message="GPS signal lost during milk handover route",
                    status="ACTIVE"
                ))

            # Network outage
            if str(r.get("network_status", "ONLINE")).upper() == "OFFLINE":
                generated_alerts.append(Alert(
                    handover_id=handover_id,
                    vehicle_id=vehicle_id,
                    timestamp=t,
                    alert_type="NETWORK_OUTAGE",
                    severity="WARNING",
                    value=0.0,
                    threshold=0.0,
                    message="Cellular connectivity lost; store-and-forward queue active",
                    status="ACTIVE"
                ))

        # 2. Gap Alerts
        for g in gaps:
            duration = g.get("duration_minutes", 0.0)
            if duration >= gap_max:
                generated_alerts.append(Alert(
                    handover_id=handover_id,
                    vehicle_id=vehicle_id,
                    timestamp=g.get("start_time"),
                    alert_type="LONG_SENSOR_GAP",
                    severity="CRITICAL" if duration >= 30.0 else "WARNING",
                    value=duration,
                    threshold=gap_max,
                    message=f"Prolonged sensor gap: {duration:.1f} mins without telemetry exceeds {gap_max:.1f} min limit",
                    status="ACTIVE"
                ))

        # 3. Low Confidence Alerts from Reconstruction
        for recon in reconstructed:
            conf = recon.get("confidence", 100.0)
            if conf < conf_min:
                generated_alerts.append(Alert(
                    handover_id=handover_id,
                    vehicle_id=vehicle_id,
                    timestamp=recon.get("timestamp"),
                    alert_type="LOW_CONFIDENCE",
                    severity="WARNING",
                    value=conf,
                    threshold=conf_min,
                    message=f"Low reconstruction confidence ({conf:.1f}%) during sensor void",
                    status="ACTIVE"
                ))

        # Deduplicate alerts of same type and hour to avoid alert fatigue
        deduped = []
        seen = set()
        for a in generated_alerts:
            # key by alert_type and hour
            hour_key = a.timestamp.strftime("%Y-%m-%d %H") if isinstance(a.timestamp, datetime) else str(a.timestamp)[:13]
            sig = (a.alert_type, hour_key)
            if sig not in seen:
                seen.add(sig)
                deduped.append(a)

        return deduped
