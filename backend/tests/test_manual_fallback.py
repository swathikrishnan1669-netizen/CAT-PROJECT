from datetime import datetime
from backend.app.database import SessionLocal
from backend.app.models import Handover, SensorReading, AuditLog
from backend.app.schemas import ManualReadingCreate
from backend.app.api.sensors import create_manual_reading

def test_manual_fallback_entry_and_audit():
    db = SessionLocal()
    try:
        # Find any handover
        ho = db.query(Handover).first()
        assert ho is not None

        req = ManualReadingCreate(
            vehicle_id=ho.vehicle_id,
            route_id=ho.route_id,
            handover_id=ho.id,
            timestamp=datetime.utcnow(),
            manually_entered_temperature=4.8,
            approximate_location="Chilling Center Bay 2",
            door_status="CLOSED",
            reason="Thermal probe cable unplugged during milk pumping",
            operator_name="Driver Rajesh",
            notes="Verified with calibrated handheld dial thermometer"
        )

        reading = create_manual_reading(req, db)
        assert reading.source == "MANUAL"
        assert reading.temperature == 4.8
        assert reading.sensor_status == "MANUAL_OVERRIDE"

        # Verify audit log was recorded
        audit = db.query(AuditLog).filter(
            AuditLog.entity == "SensorReading",
            AuditLog.entity_id == str(reading.id),
            AuditLog.action == "MANUAL_FALLBACK_ENTRY"
        ).first()

        assert audit is not None
        assert audit.user == "Driver Rajesh"
        assert "4.8" in audit.new_value
    finally:
        db.close()
