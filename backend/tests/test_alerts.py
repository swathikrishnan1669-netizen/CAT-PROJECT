from datetime import datetime
from backend.app.database import SessionLocal
from backend.services.alert_engine import AlertEngine

def test_alert_generation_critical_temperature():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        readings = [
            {"timestamp": now, "temperature": 11.2, "calibration_status": "VALID", "location_available": True, "network_status": "ONLINE"}
        ]
        alerts = AlertEngine.evaluate_handover_alerts(
            db=db,
            handover_id="TEST-HO-01",
            vehicle_id="VEH-01",
            readings=readings,
            reconstructed=[],
            gaps=[]
        )
        crit_alerts = [a for a in alerts if a.alert_type == "CRITICAL_TEMPERATURE"]
        assert len(crit_alerts) >= 1
        assert crit_alerts[0].severity == "CRITICAL"
        assert crit_alerts[0].value == 11.2
    finally:
        db.close()

def test_alert_generation_calibration_expired():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        readings = [
            {"timestamp": now, "temperature": 4.5, "calibration_status": "EXPIRED", "location_available": True, "network_status": "ONLINE"}
        ]
        alerts = AlertEngine.evaluate_handover_alerts(
            db=db,
            handover_id="TEST-HO-02",
            vehicle_id="VEH-02",
            readings=readings,
            reconstructed=[],
            gaps=[]
        )
        calib_alerts = [a for a in alerts if a.alert_type == "CALIBRATION_EXPIRED"]
        assert len(calib_alerts) >= 1
    finally:
        db.close()
