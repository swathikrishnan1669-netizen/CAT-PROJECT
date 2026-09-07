"""
Standalone Improved Thermal Gap Reconstruction Script.
Runs context-aware thermal physics interpolation on sensor telemetry.
"""
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database import SessionLocal
from backend.services.improved_engine import ImprovedEngine
from backend.app.models import SensorReading

def run_improved_benchmark():
    db = SessionLocal()
    try:
        readings = db.query(SensorReading).limit(500).all()
        readings_dicts = [
            {
                "id": r.id,
                "timestamp": r.timestamp,
                "temperature": r.temperature,
                "humidity": r.humidity,
                "door_status": r.door_status,
                "calibration_status": r.calibration_status,
                "location_available": r.location_available,
                "network_status": r.network_status,
                "is_noisy": r.is_noisy
            }
            for r in readings
        ]
        reconstructed = ImprovedEngine.reconstruct_handover_series(readings_dicts)
        print(f"[IMPROVED] Reconstructed {len(reconstructed)} missing readings.")
        if reconstructed:
            sample = reconstructed[0]
            print(f"[IMPROVED] Sample: {sample['timestamp']} -> {sample['reconstructed_value']}°C (Method: {sample['method']}, Conf: {sample['confidence']}%, Bounds: [{sample['lower_bound']}°C - {sample['upper_bound']}°C])")
    finally:
        db.close()

if __name__ == "__main__":
    run_improved_benchmark()
