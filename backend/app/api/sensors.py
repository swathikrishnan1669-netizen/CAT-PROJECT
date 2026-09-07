from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import SensorReading, Handover
from backend.app.schemas import SensorReadingBase, ManualReadingCreate
from backend.services.audit_service import AuditService
from backend.services.data_generator import DataGenerator

router = APIRouter(prefix="/api/sensors", tags=["sensors"])

@router.get("", response_model=List[SensorReadingBase])
def get_sensor_readings(
    handover_id: Optional[str] = None,
    vehicle_id: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading)
    if handover_id:
        query = query.filter(SensorReading.handover_id == handover_id)
    if vehicle_id:
        query = query.filter(SensorReading.vehicle_id == vehicle_id)
    if source:
        query = query.filter(SensorReading.source == source)

    readings = query.order_by(desc(SensorReading.timestamp)).limit(limit).all()
    return readings

@router.post("/manual", response_model=SensorReadingBase)
def create_manual_reading(
    req: ManualReadingCreate,
    db: Session = Depends(get_db)
):
    """
    Manual fallback operator entry when sensor or GPS is unavailable.
    Explicitly saved with source='MANUAL' and audited.
    """
    ho = db.query(Handover).filter(Handover.id == req.handover_id).first()
    if not ho:
        raise HTTPException(status_code=404, detail="Handover not found")

    ts = req.timestamp or datetime.utcnow()

    manual_reading = SensorReading(
        timestamp=ts,
        handover_id=req.handover_id,
        vehicle_id=req.vehicle_id,
        producer_id=ho.producer_id,
        route_id=req.route_id,
        latitude=req.latitude or ho.latitude,
        longitude=req.longitude or ho.longitude,
        temperature=req.manually_entered_temperature,
        humidity=65.0,
        door_status=req.door_status,
        door_event="NONE",
        network_status="ONLINE",
        sensor_status="MANUAL_OVERRIDE",
        calibration_status="VALID",
        battery_status=100.0,
        milk_volume=ho.milk_volume,
        location_available=True if (req.latitude or ho.latitude) else False,
        source="MANUAL",
        is_noisy=False,
        is_delayed=False
    )
    db.add(manual_reading)
    db.commit()
    db.refresh(manual_reading)

    # Log immutable audit
    AuditService.log_action(
        db=db,
        user=req.operator_name,
        action="MANUAL_FALLBACK_ENTRY",
        entity="SensorReading",
        entity_id=str(manual_reading.id),
        old_value="SENSOR_UNAVAILABLE",
        new_value=f"{req.manually_entered_temperature:.1f}°C (Location: {req.approximate_location})",
        reason=f"{req.reason} | Notes: {req.notes or 'None'}"
    )

    # Re-evaluate handover analytics to incorporate manual entry
    DataGenerator.reconstruct_and_analyze_handover(
        db=db,
        handover_id=req.handover_id,
        method="IMPROVED",
        commit=True,
        actor=f"Manual Entry ({req.operator_name})"
    )

    return manual_reading
