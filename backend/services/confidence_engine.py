import math
from typing import Dict, Any

class ConfidenceEngine:
    """
    Transparent Confidence Calculation Engine (0 - 100).
    
    Formula Formulation:
    Base confidence starts at 100 and scales multiplicatively by environmental and telemetry weights:
    
    Confidence = 100 * w_duration * w_calibration * w_gps * w_door * w_network * w_cross_sensor * w_noise
    
    Weights:
    1. Temporal Decay (w_duration):
       w_duration = exp(-0.035 * gap_minutes)
       - 0 min: 1.00 (100%)
       - 5 min: 0.84
       - 15 min: 0.59
       - 30 min: 0.35
       - 60 min: 0.12
       
    2. Calibration Factor (w_calibration):
       - VALID: 1.00
       - WARNING: 0.85
       - EXPIRED: 0.55
       
    3. GPS Availability (w_gps):
       - Location Available: 1.00
       - Location Unavailable / Fallback: 0.82
       
    4. Door Event Certainty (w_door):
       - Explicit Door Event/Status Known: 1.00
       - Missing / UNKNOWN: 0.78
       
    5. Network Status (w_network):
       - ONLINE: 1.00
       - OFFLINE (Store & Forward): 0.88
       - DEGRADED: 0.92
       
    6. Cross-Sensor Availability (w_cross_sensor):
       - Humidity & Battery & Ambient Available: 1.00
       - Partial Telemetry Available: 0.90
       - Isolated Reading: 0.80
       
    7. Noise Factor (w_noise):
       - Standard variance: 1.00
       - High noise detected: 0.75
    """

    @staticmethod
    def calculate_reading_confidence(
        gap_minutes: float = 0.0,
        calibration_status: str = "VALID",
        location_available: bool = True,
        door_status_known: bool = True,
        network_status: str = "ONLINE",
        cross_sensor_available: bool = True,
        is_noisy: bool = False
    ) -> Dict[str, Any]:
        # 1. Temporal decay
        w_duration = math.exp(-0.035 * max(0.0, gap_minutes))
        
        # 2. Calibration
        calib_upper = calibration_status.upper() if calibration_status else "VALID"
        if calib_upper == "VALID":
            w_calibration = 1.00
        elif calib_upper == "WARNING":
            w_calibration = 0.85
        else: # EXPIRED or FAULT
            w_calibration = 0.55
            
        # 3. GPS
        w_gps = 1.00 if location_available else 0.82
        
        # 4. Door status certainty
        w_door = 1.00 if door_status_known else 0.78
        
        # 5. Network status
        net_upper = network_status.upper() if network_status else "ONLINE"
        if net_upper == "ONLINE":
            w_network = 1.00
        elif net_upper == "DEGRADED":
            w_network = 0.92
        else:
            w_network = 0.88
            
        # 6. Cross-sensor telemetry
        w_cross = 1.00 if cross_sensor_available else 0.85
        
        # 7. Noise penalty
        w_noise = 0.75 if is_noisy else 1.00

        # Composite score
        raw_score = 100.0 * w_duration * w_calibration * w_gps * w_door * w_network * w_cross * w_noise
        score = max(5.0, min(100.0, round(raw_score, 1)))

        # Category interpretation
        if score >= 90.0:
            category = "Very High Confidence"
            tier = "VERY_HIGH"
        elif score >= 75.0:
            category = "High Confidence"
            tier = "HIGH"
        elif score >= 50.0:
            category = "Medium Confidence"
            tier = "MEDIUM"
        else:
            category = "Low Confidence"
            tier = "LOW"

        return {
            "score": score,
            "category": category,
            "tier": tier,
            "components": {
                "duration_weight": round(w_duration, 3),
                "calibration_weight": w_calibration,
                "gps_weight": w_gps,
                "door_weight": w_door,
                "network_weight": w_network,
                "cross_sensor_weight": w_cross,
                "noise_weight": w_noise
            }
        }
