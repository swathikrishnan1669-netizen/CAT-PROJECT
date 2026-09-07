from datetime import datetime, timedelta
from backend.services.exposure_analyzer import ExposureAnalyzer

def test_exposure_detection_high_temp():
    base_time = datetime(2026, 9, 1, 10, 0)
    sensors = [
        {"timestamp": base_time, "temperature": 4.0, "is_noisy": False},
        {"timestamp": base_time + timedelta(minutes=1), "temperature": 8.5, "is_noisy": False}, # excursion
        {"timestamp": base_time + timedelta(minutes=2), "temperature": 8.8, "is_noisy": False},
        {"timestamp": base_time + timedelta(minutes=3), "temperature": 4.2, "is_noisy": False}
    ]

    periods = ExposureAnalyzer.identify_uncertain_periods(
        reconstructed_readings=[],
        sensor_readings=sensors,
        warning_temp_threshold=8.0,
        critical_temp_threshold=10.0
    )

    assert len(periods) == 1
    assert periods[0]["estimated_temperature"] >= 8.5
    assert periods[0]["risk_level"] in ["MEDIUM", "HIGH"]

def test_exposure_detection_low_confidence():
    base_time = datetime(2026, 9, 1, 10, 0)
    recon = [
        {"timestamp": base_time + timedelta(minutes=1), "reconstructed_value": 7.0, "confidence": 42.0, "upper_bound": 8.6, "lower_bound": 5.4},
        {"timestamp": base_time + timedelta(minutes=2), "reconstructed_value": 7.2, "confidence": 40.0, "upper_bound": 8.8, "lower_bound": 5.6}
    ]

    periods = ExposureAnalyzer.identify_uncertain_periods(
        reconstructed_readings=recon,
        sensor_readings=[],
        warning_temp_threshold=8.0
    )

    assert len(periods) == 1
    assert periods[0]["confidence"] <= 45.0
