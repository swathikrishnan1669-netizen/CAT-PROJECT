from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.database import get_db
from backend.app.models import (
    Handover, SensorReading, ReconstructedReading, UncertainExposure, Alert,
    Route, SyncQueue
)
from backend.app.schemas import DashboardStats, AlertBase
from backend.app.api.simulation import NETWORK_STATE

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_handovers = db.query(Handover).count()
    total_sensor_readings = db.query(SensorReading).count()
    missing_readings = db.query(SensorReading).filter(SensorReading.temperature.is_(None)).count()
    reconstructed_readings = db.query(ReconstructedReading).count()

    total_exposure_result = db.query(func.sum(UncertainExposure.duration_minutes)).scalar()
    uncertain_exposure_duration_minutes = round(float(total_exposure_result), 1) if total_exposure_result else 0.0

    critical_alerts_count = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.status == "ACTIVE").count()
    warning_alerts_count = db.query(Alert).filter(Alert.severity == "WARNING", Alert.status == "ACTIVE").count()

    low_conf_count = db.query(ReconstructedReading).filter(ReconstructedReading.confidence < 50.0).count()
    offline_queue_count = db.query(SyncQueue).filter(SyncQueue.status == "PENDING").count()
    manual_fallback_count = db.query(SensorReading).filter(SensorReading.source == "MANUAL").count()

    avg_conf_result = db.query(func.avg(Handover.overall_confidence)).scalar()
    average_confidence = round(float(avg_conf_result), 1) if avg_conf_result else 85.0

    # Route risk summary
    routes = db.query(Route).all()
    route_summaries = []
    for r in routes:
        ho_count = db.query(Handover).filter(Handover.route_id == r.id).count()
        crit_ho = db.query(Handover).filter(Handover.route_id == r.id, Handover.risk_level == "CRITICAL").count()
        warn_ho = db.query(Handover).filter(Handover.route_id == r.id, Handover.risk_level.in_(["HIGH", "MEDIUM"])).count()
        route_exposure = db.query(func.sum(UncertainExposure.duration_minutes)).join(Handover).filter(Handover.route_id == r.id).scalar()
        
        route_summaries.append({
            "route_id": r.id,
            "route_name": r.route_name,
            "handovers_count": ho_count,
            "critical_handovers": crit_ho,
            "warning_handovers": warn_ho,
            "uncertain_exposure_minutes": round(float(route_exposure), 1) if route_exposure else 0.0,
            "overall_status": "CRITICAL" if crit_ho > 0 else ("WARNING" if warn_ho > 0 else "NORMAL")
        })

    # Recent alerts
    recent_alerts = db.query(Alert).order_by(desc(Alert.timestamp)).limit(5).all()

    return DashboardStats(
        total_handovers=total_handovers,
        total_sensor_readings=total_sensor_readings,
        missing_readings=missing_readings,
        reconstructed_readings=reconstructed_readings,
        uncertain_exposure_duration_minutes=uncertain_exposure_duration_minutes,
        critical_alerts_count=critical_alerts_count,
        warning_alerts_count=warning_alerts_count,
        low_confidence_periods_count=low_conf_count,
        offline_sync_queue_count=offline_queue_count,
        manual_fallback_count=manual_fallback_count,
        average_confidence=average_confidence,
        system_network_status=NETWORK_STATE["status"],
        routes_risk_summary=route_summaries,
        recent_alerts=[AlertBase.model_validate(a) for a in recent_alerts]
    )
