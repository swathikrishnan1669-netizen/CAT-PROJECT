from datetime import datetime, timedelta
import numpy as np
from backend.services.baseline_engine import BaselineEngine
from backend.services.improved_engine import ImprovedEngine

def test_baseline_forward_fill_and_linear():
    base_time = datetime(2026, 9, 1, 10, 0)
    readings = [
        {"id": 1, "timestamp": base_time + timedelta(minutes=0), "temperature": 4.0, "actual_value": 4.0},
        {"id": 2, "timestamp": base_time + timedelta(minutes=1), "temperature": None, "actual_value": 4.5},
        {"id": 3, "timestamp": base_time + timedelta(minutes=2), "temperature": None, "actual_value": 5.0},
        {"id": 4, "timestamp": base_time + timedelta(minutes=3), "temperature": 6.0, "actual_value": 6.0}
    ]

    reconstructed = BaselineEngine.reconstruct_handover_series(readings)
    assert len(reconstructed) == 2
    # Minute 1: linear between 4.0 and 6.0 should be approx 4.67
    assert 4.5 <= reconstructed[0]["reconstructed_value"] <= 4.8
    assert reconstructed[0]["method"] == "BASELINE_LINEAR"

def test_improved_thermal_context():
    base_time = datetime(2026, 9, 1, 14, 0) # 2 PM warm afternoon
    readings = [
        {"id": 1, "timestamp": base_time + timedelta(minutes=0), "temperature": 4.0, "door_status": "OPEN", "location_available": True},
        {"id": 2, "timestamp": base_time + timedelta(minutes=1), "temperature": None, "door_status": "OPEN", "location_available": True, "humidity": 70.0},
        {"id": 3, "timestamp": base_time + timedelta(minutes=2), "temperature": None, "door_status": "OPEN", "location_available": True, "humidity": 70.0},
        {"id": 4, "timestamp": base_time + timedelta(minutes=3), "temperature": 5.2, "door_status": "OPEN", "location_available": True}
    ]

    reconstructed = ImprovedEngine.reconstruct_handover_series(readings)
    assert len(reconstructed) == 2
    assert reconstructed[0]["method"] == "IMPROVED_CONTEXTUAL"
    # Should have uncertainty bounds
    assert reconstructed[0]["lower_bound"] is not None
    assert reconstructed[0]["upper_bound"] is not None
    assert reconstructed[0]["upper_bound"] >= reconstructed[0]["reconstructed_value"]
    assert reconstructed[0]["lower_bound"] <= reconstructed[0]["reconstructed_value"]
