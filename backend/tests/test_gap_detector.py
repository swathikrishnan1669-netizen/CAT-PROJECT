from datetime import datetime, timedelta
from backend.services.gap_detector import GapDetector

def test_gap_detector_missing_cadence():
    base_time = datetime(2026, 9, 1, 10, 0)
    # Stream with normal 1-min readings, then a 15-min gap
    readings = [
        {"timestamp": base_time + timedelta(minutes=0), "temperature": 4.1, "location_available": True},
        {"timestamp": base_time + timedelta(minutes=1), "temperature": 4.2, "location_available": True},
        # Missing minutes 2 to 16
        {"timestamp": base_time + timedelta(minutes=17), "temperature": 4.5, "location_available": True},
        {"timestamp": base_time + timedelta(minutes=18), "temperature": 4.4, "location_available": True}
    ]

    analysis = GapDetector.analyze_stream(readings)
    assert len(analysis["gaps"]) == 1
    gap = analysis["gaps"][0]
    assert gap["duration_minutes"] == 16.0
    assert analysis["missing_count"] >= 15

def test_gap_detector_noisy_spike():
    base_time = datetime(2026, 9, 1, 10, 0)
    readings = [
        {"timestamp": base_time + timedelta(minutes=0), "temperature": 4.0, "door_status": "CLOSED"},
        {"timestamp": base_time + timedelta(minutes=1), "temperature": 25.0, "door_status": "CLOSED"}, # Glitch
        {"timestamp": base_time + timedelta(minutes=2), "temperature": 4.2, "door_status": "CLOSED"}
    ]

    analysis = GapDetector.analyze_stream(readings)
    assert analysis["noisy_count"] >= 1
    assert 1 in analysis["noisy_indices"]

def test_gap_detector_telemetry_dropout():
    base_time = datetime(2026, 9, 1, 10, 0)
    readings = [
        {"timestamp": base_time, "temperature": 4.0, "location_available": False, "calibration_status": "EXPIRED", "network_status": "OFFLINE"}
    ]

    analysis = GapDetector.analyze_stream(readings)
    issues = [i["issue"] for i in analysis["telemetry_issues"]]
    assert "GPS_UNAVAILABLE" in issues
    assert "CALIBRATION_EXPIRED" in issues
    assert "NETWORK_OFFLINE" in issues
