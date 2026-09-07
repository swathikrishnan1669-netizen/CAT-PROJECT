"""
Standalone Baseline Gap Reconstruction Script.
Runs forward fill and naive linear interpolation on sensor telemetry.
"""
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database import SessionLocal
from backend.services.baseline_engine import BaselineEngine
from backend.app.models import SensorReading

def run_baseline_benchmark():
    db = SessionLocal()
    try:
        readings = db.query(SensorReading).limit(500).all()
        readings_dicts = [
            {"id": r.id, "timestamp": r.timestamp, "temperature": r.temperature, "door_status": r.door_status}
            for r in readings
        ]
        reconstructed = BaselineEngine.reconstruct_handover_series(readings_dicts)
        print(f"[BASELINE] Reconstructed {len(reconstructed)} missing readings.")
        if reconstructed:
            sample = reconstructed[0]
            print(f"[BASELINE] Sample: {sample['timestamp']} -> {sample['reconstructed_value']}°C (Method: {sample['method']}, Conf: {sample['confidence']}%)")
    finally:
        db.close()

if __name__ == "__main__":
    run_baseline_benchmark()
