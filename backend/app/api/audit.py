from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import AuditLog
from backend.app.schemas import AuditLogBase

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("", response_model=List[AuditLogBase])
def get_audit_trail(
    user: Optional[str] = None,
    entity: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if user:
        query = query.filter(AuditLog.user.ilike(f"%{user}%"))
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return logs
