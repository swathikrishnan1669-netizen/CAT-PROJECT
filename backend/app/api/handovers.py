from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import Handover, Producer, Vehicle, Route, SensorReading, ReconstructedReading, UncertainExposure, Alert, AuditLog
from backend.app.schemas import HandoverListItem, HandoverDetail, ReconstructionRequest
from backend.services.data_generator import DataGenerator
from backend.services.gap_detector import GapDetector

router = APIRouter(prefix="/api/handovers", tags=["handovers"])

@router.get("", response_model=List[HandoverListItem])
def list_handovers(
    route_id: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Handover)
    if route_id:
        query = query.filter(Handover.route_id == route_id)
    if risk_level:
        query = query.filter(Handover.risk_level == risk_level)
    if search:
        query = query.join(Producer).filter(
            (Handover.id.ilike(f"%{search}%")) |
            (Producer.name.ilike(f"%{search}%")) |
            (Handover.location.ilike(f"%{search}%"))
        )

    handovers = query.order_by(desc(Handover.start_time)).limit(limit).all()

    results = []
    for ho in handovers:
        # Count gaps and active alerts
        total_gaps = db.query(ReconstructedReading).filter(ReconstructedReading.handover_id == ho.id).count()
        active_alerts = db.query(Alert).filter(Alert.handover_id == ho.id, Alert.status == "ACTIVE").count()

        results.append(HandoverListItem(
            id=ho.id,
            producer_id=ho.producer_id,
            producer_name=ho.producer.name if ho.producer else None,
            vehicle_id=ho.vehicle_id,
            vehicle_number=ho.vehicle.vehicle_number if ho.vehicle else None,
            route_id=ho.route_id,
            route_name=ho.route.route_name if ho.route else None,
            location=ho.location,
            start_time=ho.start_time,
            end_time=ho.end_time,
            duration_minutes=ho.duration_minutes,
            milk_volume=ho.milk_volume,
            status=ho.status,
            overall_confidence=ho.overall_confidence,
            risk_level=ho.risk_level,
            total_gaps=total_gaps,
            active_alerts=active_alerts
        ))

    return results

@router.get("/{handover_id}", response_model=HandoverDetail)
def get_handover_details(handover_id: str, db: Session = Depends(get_db)):
    ho = db.query(Handover).filter(Handover.id == handover_id).first()
    if not ho:
        raise HTTPException(status_code=404, detail="Handover not found")

    sensor_readings = db.query(SensorReading).filter(
        SensorReading.handover_id == handover_id
    ).order_by(SensorReading.timestamp).all()

    reconstructed_readings = db.query(ReconstructedReading).filter(
        ReconstructedReading.handover_id == handover_id
    ).order_by(ReconstructedReading.timestamp).all()

    uncertain_exposures = db.query(UncertainExposure).filter(
        UncertainExposure.handover_id == handover_id
    ).order_by(UncertainExposure.start_time).all()

    alerts = db.query(Alert).filter(
        Alert.handover_id == handover_id
    ).order_by(desc(Alert.timestamp)).all()

    audit_history = db.query(AuditLog).filter(
        AuditLog.entity == "Handover",
        AuditLog.entity_id == handover_id
    ).order_by(desc(AuditLog.timestamp)).all()

    # Gap summary
    readings_dicts = [{"timestamp": r.timestamp, "temperature": r.temperature} for r in sensor_readings]
    gap_info = GapDetector.analyze_stream(readings_dicts)

    return HandoverDetail(
        id=ho.id,
        producer=ho.producer,
        vehicle=ho.vehicle,
        route=ho.route,
        location=ho.location,
        latitude=ho.latitude,
        longitude=ho.longitude,
        start_time=ho.start_time,
        end_time=ho.end_time,
        duration_minutes=ho.duration_minutes,
        milk_volume=ho.milk_volume,
        status=ho.status,
        overall_confidence=ho.overall_confidence,
        risk_level=ho.risk_level,
        sensor_readings=sensor_readings,
        reconstructed_readings=reconstructed_readings,
        uncertain_exposures=uncertain_exposures,
        alerts=alerts,
        audit_history=audit_history,
        gap_summary=gap_info
    )

@router.post("/{handover_id}/reconstruct")
def trigger_reconstruction(
    handover_id: str,
    req: ReconstructionRequest,
    db: Session = Depends(get_db)
):
    ho = db.query(Handover).filter(Handover.id == handover_id).first()
    if not ho:
        raise HTTPException(status_code=404, detail="Handover not found")

    result = DataGenerator.reconstruct_and_analyze_handover(
        db=db,
        handover_id=handover_id,
        method=req.method.upper(),
        commit=True,
        actor=req.user
    )
    return result
