from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models import AuditLog

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        user: str,
        action: str,
        entity: str,
        entity_id: str,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        reason: Optional[str] = None,
        reconstruction_method: Optional[str] = None,
        confidence_before: Optional[float] = None,
        confidence_after: Optional[float] = None
    ) -> AuditLog:
        """
        Appends an immutable audit log record. Historical decisions are NEVER overwritten.
        """
        entry = AuditLog(
            timestamp=datetime.utcnow(),
            user=user,
            action=action,
            entity=entity,
            entity_id=str(entity_id),
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
            reason=reason,
            reconstruction_method=reconstruction_method,
            confidence_before=confidence_before,
            confidence_after=confidence_after
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
