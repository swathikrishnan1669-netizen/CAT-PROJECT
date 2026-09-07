from backend.services.confidence_engine import ConfidenceEngine

def test_confidence_decay_with_gap_duration():
    c_0 = ConfidenceEngine.calculate_reading_confidence(gap_minutes=0.0)["score"]
    c_5 = ConfidenceEngine.calculate_reading_confidence(gap_minutes=5.0)["score"]
    c_15 = ConfidenceEngine.calculate_reading_confidence(gap_minutes=15.0)["score"]
    c_30 = ConfidenceEngine.calculate_reading_confidence(gap_minutes=30.0)["score"]
    c_60 = ConfidenceEngine.calculate_reading_confidence(gap_minutes=60.0)["score"]

    assert c_0 >= c_5 >= c_15 >= c_30 >= c_60
    assert c_0 == 100.0
    assert c_60 < 30.0

def test_confidence_calibration_penalty():
    c_valid = ConfidenceEngine.calculate_reading_confidence(gap_minutes=5.0, calibration_status="VALID")["score"]
    c_expired = ConfidenceEngine.calculate_reading_confidence(gap_minutes=5.0, calibration_status="EXPIRED")["score"]

    assert c_valid > c_expired
    assert c_expired < 60.0

def test_confidence_gps_penalty():
    c_gps = ConfidenceEngine.calculate_reading_confidence(gap_minutes=5.0, location_available=True)["score"]
    c_nogps = ConfidenceEngine.calculate_reading_confidence(gap_minutes=5.0, location_available=False)["score"]

    assert c_gps > c_nogps
