from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import Handover, SensorReading, SyncQueue, Alert
from backend.services.store_and_forward import StoreAndForwardService
from backend.services.audit_service import AuditService
from backend.services.data_generator import DataGenerator

router = APIRouter(prefix="/api/simulate", tags=["simulation"])

# In-memory network state toggle for prototype
NETWORK_STATE = {"status": "ONLINE"}

@router.get("/network-status")
def get_network_status(db: Session = Depends(get_db)):
    pending = StoreAndForwardService.get_pending_count(db)
    return {
        "status": NETWORK_STATE["status"],
        "pending_sync_count": pending
    }

@router.post("/network-offline")
def simulate_network_offline(
    user: str = Body("Sim Operator", embed=True),
    db: Session = Depends(get_db)
):
    """
    Failure Case 1: Carrier network drops.
    Enqueues incoming telemetry into local sync queue (store-and-forward).
    """
    NETWORK_STATE["status"] = "OFFLINE"

    # Enqueue 5 simulated readings during the outage
    latest_ho = db.query(Handover).order_by(desc(Handover.start_time)).first()
    ho_id = latest_ho.id if latest_ho else "HO-0001"
    now = datetime.utcnow()

    queued_items = []
    for i in range(5):
        reading_dict = {
            "timestamp": now + timedelta(minutes=i),
            "handover_id": ho_id,
            "vehicle_id": latest_ho.vehicle_id if latest_ho else "VEH-01",
            "route_id": latest_ho.route_id if latest_ho else "RT-01",
            "latitude": 13.133,
            "longitude": 78.139,
            "temperature": round(4.2 + (i * 0.1), 2),
            "humidity": 66.0,
            "door_status": "CLOSED",
            "door_event": "NONE",
            "network_status": "OFFLINE",
            "sensor_status": "OK",
            "calibration_status": "VALID",
            "battery_status": 88.0,
            "milk_volume": 200.0,
            "location_available": True,
            "is_noisy": False
        }
        item = StoreAndForwardService.enqueue_reading(db, reading_dict)
        queued_items.append(item.id)

    pending_count = StoreAndForwardService.get_pending_count(db)

    AuditService.log_action(
        db=db,
        user=user,
        action="SIMULATE_NETWORK_OFFLINE",
        entity="NetworkManager",
        entity_id="CELLULAR",
        old_value="ONLINE",
        new_value="OFFLINE",
        reason=f"Simulated network blackout; buffered {len(queued_items)} records into store-and-forward queue (Total pending: {pending_count})"
    )

    return {
        "status": "OFFLINE",
        "records_buffered": len(queued_items),
        "pending_sync_count": pending_count,
        "message": f"{pending_count} records waiting to sync"
    }

@router.post("/network-online")
def simulate_network_online(
    user: str = Body("Sim Operator", embed=True),
    db: Session = Depends(get_db)
):
    """
    Restores network connectivity and flushes the store-and-forward sync queue.
    """
    NETWORK_STATE["status"] = "ONLINE"
    sync_result = StoreAndForwardService.synchronize_queue(db, user=user)

    return {
        "status": "ONLINE",
        "sync_result": sync_result,
        "pending_sync_count": 0,
        "message": sync_result["message"]
    }

@router.post("/temp-failure")
def simulate_temperature_sensor_failure(
    handover_id: Optional[str] = Body(None, embed=True),
    user: str = Body("Sim Operator", embed=True),
    db: Session = Depends(get_db)
):
    """
    Failure Case 2: Temperature sensor failure during handover.
    Simulates probe detachment/failure for a 15-minute gap and evaluates fallback.
    """
    ho = db.query(Handover).filter(Handover.id == handover_id).first() if handover_id else db.query(Handover).order_by(desc(Handover.start_time)).first()
    if not ho:
        raise HTTPException(status_code=404, detail="Handover not found")

    readings = db.query(SensorReading).filter(SensorReading.handover_id == ho.id).order_by(SensorReading.timestamp).all()
    # Blank out temperature on the middle 12 readings
    mid = len(readings) // 2
    affected_count = 0
    for i in range(max(0, mid - 6), min(len(readings), mid + 6)):
        readings[i].temperature = None
        readings[i].sensor_status = "FAULT"
        affected_count += 1
    db.commit()

    # Re-run reconstruction and analytics
    result = DataGenerator.reconstruct_and_analyze_handover(
        db=db,
        handover_id=ho.id,
        method="IMPROVED",
        commit=True,
        actor=f"{user} (Temp Sensor Failure Sim)"
    )

    AuditService.log_action(
        db=db,
        user=user,
        action="SIMULATE_TEMP_SENSOR_FAILURE",
        entity="Handover",
        entity_id=ho.id,
        old_value="ACTIVE_SENSOR",
        new_value=f"FAULT ({affected_count} readings voided)",
        reason="Simulated hardware probe disconnect; fallback contextual model engaged"
    )

    return {
        "handover_id": ho.id,
        "voided_readings": affected_count,
        "analytics": result,
        "message": f"Simulated temperature sensor failure on {ho.id}. Confidence reduced to {result['average_confidence']}%."
    }

@router.post("/gps-failure")
def simulate_gps_failure(
    handover_id: Optional[str] = Body(None, embed=True),
    user: str = Body("Sim Operator", embed=True),
    db: Session = Depends(get_db)
):
    """
    Failure Case 3: GPS sensor failure during handover / route transit.
    Location marked unavailable; triggers dead-reckoning fallback warning.
    """
    ho = db.query(Handover).filter(Handover.id == handover_id).first() if handover_id else db.query(Handover).order_by(desc(Handover.start_time)).first()
    if not ho:
        raise HTTPException(status_code=404, detail="Handover not found")

    readings = db.query(SensorReading).filter(SensorReading.handover_id == ho.id).all()
    for r in readings:
        r.location_available = False
        r.latitude = None
        r.longitude = None
    db.commit()

    # Re-run analysis
    result = DataGenerator.reconstruct_and_analyze_handover(
        db=db,
        handover_id=ho.id,
        method="IMPROVED",
        commit=True,
        actor=f"{user} (GPS Failure Sim)"
    )

    AuditService.log_action(
        db=db,
        user=user,
        action="SIMULATE_GPS_FAILURE",
        entity="Handover",
        entity_id=ho.id,
        old_value="GPS_LOCK",
        new_value="GPS_UNAVAILABLE",
        reason="Simulated GPS satellite lock failure; route coordinate fallback activated"
    )

    return {
        "handover_id": ho.id,
        "analytics": result,
        "message": f"GPS signal lost for handover {ho.id}. Route waypoint fallback activated."
    }

@router.post("/calibration-expiry")
def simulate_calibration_expiry(
    handover_id: Optional[str] = Body(None, embed=True),
    user: str = Body("Sim Operator", embed=True),
    db: Session = Depends(get_db)
):
    """
    Failure Case 4: Sensor calibration expired.
    Penalizes confidence score and fires CALIBRATION_EXPIRED alert.
    """
    ho = db.query(Handover).filter(Handover.id == handover_id).first() if handover_id else db.query(Handover).order_by(desc(Handover.start_time)).first()
    if not ho:
        raise HTTPException(status_code=404, detail="Handover not found")

    readings = db.query(SensorReading).filter(SensorReading.handover_id == ho.id).all()
    for r in readings:
        r.calibration_status = "EXPIRED"
    db.commit()

    # Re-run analysis
    result = DataGenerator.reconstruct_and_analyze_handover(
        db=db,
        handover_id=ho.id,
        method="IMPROVED",
        commit=True,
        actor=f"{user} (Calibration Expiry Sim)"
    )

    AuditService.log_action(
        db=db,
        user=user,
        action="SIMULATE_CALIBRATION_EXPIRY",
        entity="Handover",
        entity_id=ho.id,
        old_value="VALID",
        new_value="EXPIRED",
        reason="Sensor calibration validity expired; confidence score penalised"
    )

    return {
        "handover_id": ho.id,
        "analytics": result,
        "message": f"Calibration marked EXPIRED on {ho.id}. Confidence dropped to {result['average_confidence']}%."
    }

@router.post("/inject-gap")
def inject_gap(
    duration_minutes: int = Body(15, embed=True),
    handover_id: Optional[str] = Body(None, embed=True),
    user: str = Body("Sim Operator", embed=True),
    db: Session = Depends(get_db)
):
    """
    Injects a 15-minute or 30-minute sensor gap into a handover.
    """
    ho = db.query(Handover).filter(Handover.id == handover_id).first() if handover_id else db.query(Handover).order_by(desc(Handover.start_time)).first()
    if not ho:
        raise HTTPException(status_code=404, detail="Handover not found")

    readings = db.query(SensorReading).filter(SensorReading.handover_id == ho.id).order_by(SensorReading.timestamp).all()
    count_to_void = min(len(readings), duration_minutes)
    start_idx = max(0, (len(readings) - count_to_void) // 2)

    for i in range(start_idx, start_idx + count_to_void):
        readings[i].temperature = None
        readings[i].sensor_status = "UNAVAILABLE"
    db.commit()

    result = DataGenerator.reconstruct_and_analyze_handover(
        db=db,
        handover_id=ho.id,
        method="IMPROVED",
        commit=True,
        actor=f"{user} (Gap Injection {duration_minutes}m)"
    )

    return {
        "handover_id": ho.id,
        "gap_injected_minutes": duration_minutes,
        "analytics": result,
        "message": f"Injected {duration_minutes}-minute gap into handover {ho.id}."
    }

@router.post("/reset-demo")
def reset_demo_dataset(db: Session = Depends(get_db)):
    """
    Regenerates standard 7-day clean/realistic synthetic dataset.
    """
    DataGenerator.generate_full_dataset(db, days=7)
    return {
        "status": "SUCCESS",
        "message": "7-day realistic dairy cold-chain demo dataset regenerated successfully."
    }
