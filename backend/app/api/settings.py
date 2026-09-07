from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import ThresholdSetting
from backend.app.schemas import ThresholdItem, ThresholdUpdateRequest
from backend.services.audit_service import AuditService

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("/thresholds", response_model=List[ThresholdItem])
def get_thresholds(db: Session = Depends(get_db)):
    settings = db.query(ThresholdSetting).all()
    return settings

@router.post("/thresholds", response_model=ThresholdItem)
def update_threshold(req: ThresholdUpdateRequest, db: Session = Depends(get_db)):
    setting = db.query(ThresholdSetting).filter(ThresholdSetting.key == req.key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Threshold setting key not found")

    old_val = setting.value
    setting.value = req.value
    setting.updated_at = datetime.utcnow()
    setting.updated_by = req.user
    db.commit()
    db.refresh(setting)

    # Log immutable audit
    AuditService.log_action(
        db=db,
        user=req.user,
        action="UPDATE_ALERT_THRESHOLD",
        entity="ThresholdSetting",
        entity_id=req.key,
        old_value=f"{old_val} {setting.unit}",
        new_value=f"{req.value} {setting.unit}",
        reason=req.reason
    )

    return setting
