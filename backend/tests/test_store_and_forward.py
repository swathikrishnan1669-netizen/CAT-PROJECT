from datetime import datetime
from backend.app.database import SessionLocal
from backend.services.store_and_forward import StoreAndForwardService

def test_store_and_forward_lifecycle():
    db = SessionLocal()
    try:
        # 1. Enqueue reading while offline
        reading_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "handover_id": "HO-TEST-SYNC",
            "vehicle_id": "VEH-01",
            "route_id": "RT-01",
            "temperature": 4.1,
            "humidity": 65.0,
            "door_status": "CLOSED"
        }
        item = StoreAndForwardService.enqueue_reading(db, reading_data)
        assert item.status == "PENDING"

        pending_count = StoreAndForwardService.get_pending_count(db)
        assert pending_count >= 1

        # 2. Synchronize when online
        sync_result = StoreAndForwardService.synchronize_queue(db, user="Test Runner")
        assert sync_result["status"] == "COMPLETED"
        assert sync_result["synchronized_count"] >= 1

        # 3. Verify queue is flushed
        assert StoreAndForwardService.get_pending_count(db) == 0
    finally:
        db.close()
