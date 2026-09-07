import json
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models import SyncQueue, SensorReading
from backend.services.audit_service import AuditService

class StoreAndForwardService:
    """
    Store-and-Forward Network Outage Simulation & Synchronization Engine.
    
    When cellular connectivity is interrupted (OFFLINE):
    - Incoming sensor payloads are safely persisted in the local SQLite sync_queue.
    - System status indicates pending backlog ("X records waiting to sync").
    
    When connection is restored (ONLINE):
    - System flushes queue, parses payloads, imports them as SYNCHRONIZED sensor readings,
      updates sync timestamps, and logs an immutable audit event.
    """

    @staticmethod
    def enqueue_reading(db: Session, reading_dict: Dict[str, Any]) -> SyncQueue:
        # Serialise datetimes to ISO
        clean_dict = {}
        for k, v in reading_dict.items():
            if isinstance(v, datetime):
                clean_dict[k] = v.isoformat()
            else:
                clean_dict[k] = v

        item = SyncQueue(
            timestamp=datetime.utcnow(),
            payload=json.dumps(clean_dict),
            status="PENDING",
            retry_count=0
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def get_pending_count(db: Session) -> int:
        return db.query(SyncQueue).filter(SyncQueue.status == "PENDING").count()

    @staticmethod
    def synchronize_queue(db: Session, user: str = "Automated Sync Agent") -> Dict[str, Any]:
        pending_items = db.query(SyncQueue).filter(SyncQueue.status == "PENDING").all()
        total_pending = len(pending_items)

        if total_pending == 0:
            return {
                "synchronized_count": 0,
                "status": "UP_TO_DATE",
                "message": "0 records waiting to sync. Queue is clear."
            }

        synced_count = 0
        now = datetime.utcnow()

        for item in pending_items:
            try:
                item.status = "SYNCHRONIZING"
                data = json.loads(item.payload)
                
                # Parse timestamp
                ts = datetime.fromisoformat(data["timestamp"]) if "timestamp" in data and isinstance(data["timestamp"], str) else now

                new_reading = SensorReading(
                    timestamp=ts,
                    handover_id=data.get("handover_id"),
                    vehicle_id=data.get("vehicle_id", "VEH-01"),
                    producer_id=data.get("producer_id"),
                    route_id=data.get("route_id", "RT-01"),
                    latitude=data.get("latitude"),
                    longitude=data.get("longitude"),
                    temperature=data.get("temperature"),
                    humidity=data.get("humidity"),
                    door_status=data.get("door_status", "CLOSED"),
                    door_event=data.get("door_event", "NONE"),
                    network_status="ONLINE", # restored
                    sensor_status=data.get("sensor_status", "OK"),
                    calibration_status=data.get("calibration_status", "VALID"),
                    battery_status=data.get("battery_status", 90.0),
                    milk_volume=data.get("milk_volume", 0.0),
                    location_available=data.get("location_available", True),
                    source="SYNCHRONIZED",
                    is_noisy=data.get("is_noisy", False),
                    is_delayed=True
                )
                db.add(new_reading)
                
                item.status = "SYNCHRONIZED"
                item.synced_at = now
                synced_count += 1
            except Exception as e:
                item.status = "FAILED"
                item.retry_count += 1

        db.commit()

        # Audit the synchronization event
        AuditService.log_action(
            db=db,
            user=user,
            action="STORE_AND_FORWARD_SYNC",
            entity="SyncQueue",
            entity_id="BATCH",
            old_value=f"{total_pending} records pending",
            new_value=f"{synced_count} records synchronized",
            reason="Network connectivity restored; local buffer flushed successfully"
        )

        return {
            "synchronized_count": synced_count,
            "status": "COMPLETED",
            "message": f"{synced_count} records successfully synchronized"
        }
