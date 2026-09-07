from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import Alert
from backend.app.schemas import AlertBase, AlertAcknowledgeRequest
from backend.services.audit_service import AuditService

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertBase])
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    handover_id: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    if handover_id:
        query = query.filter(Alert.handover_id == handover_id)

    alerts = query.order_by(desc(Alert.timestamp)).limit(limit).all()
    return alerts

@router.post("/{alert_id}/acknowledge", response_model=AlertBase)
def acknowledge_alert(
    alert_id: int,
    req: AlertAcknowledgeRequest,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    old_status = alert.status
    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by = req.user
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)

    # Log audit
    AuditService.log_action(
        db=db,
        user=req.user,
        action="ACKNOWLEDGE_ALERT",
        entity="Alert",
        entity_id=str(alert.id),
        old_value=old_status,
        new_value="ACKNOWLEDGED",
        reason=f"Operator acknowledged alert: {alert.message}. Notes: {req.notes or 'None'}"
    )

    return alert
