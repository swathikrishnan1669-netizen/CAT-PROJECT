# Cold-Chain Operational & Algorithmic Risk Register

This document provides a comprehensive risk assessment covering sensor hardware, data transport, reconstruction algorithms, human factors, and regulatory compliance.

---

## 1. Risk Evaluation Matrix

| Risk ID | Hazard Description | Probability | Impact | Risk Level | Mitigation Strategy | Owner |
|---|---|---|---|---|---|---|
| **RSK-01** | **Incorrect Reconstruction During Long Gaps**<br/>Extended sensor voids (>30 min) during unmonitored door openings lead to underestimating milk temperature. | Medium | High | **HIGH** | Apply exponential temporal confidence decay; expand upper uncertainty envelope $[T_{\min}, T_{\max}]$; flag any gap $>15$ min as an operational alert. | Data Analyst / QA Manager |
| **RSK-02** | **Overconfidence in Reconstructed Values**<br/>Operations staff treat reconstructed values as certified physical readings, neglecting physical inspection. | Medium | Critical | **CRITICAL** | Enforce strict visual separation on all UI charts (dashed lines, amber badges, clear labels); display explicit confidence scores; require manual review below 75% confidence. | UX Designer / Operations Lead |
| **RSK-03** | **Sensor Calibration Expiry & Thermal Drift**<br/>Aging thermistors drift upward/downward by 1.5°C without generating fatal hardware faults. | High | Medium | **HIGH** | Track calibration dates in database; automatically penalize reading confidence by 45% when calibration is expired; fire proactive maintenance alerts. | Fleet Maintenance Lead |
| **RSK-04** | **Cellular Network Blackouts (Store-and-Forward Drop)**<br/>Rural transit corridors lose 4G connectivity, delaying real-time temperature visibility at headquarters. | High | Medium | **MEDIUM** | Implement persistent SQLite/Flash local buffer; auto-synchronize on network recovery; mark delayed data with `is_delayed=True` and log sync events. | IoT Hardware Engineer |
| **RSK-05** | **GPS Satellite Lock Failure in Valleys**<br/>Tanker enters mountain pass; location coordinates become null, masking actual handover location. | High | Low | **LOW** | Fallback to route waypoint schedule and last known good coordinate; flag `location_available=False`; apply 18% confidence penalty. | Fleet Dispatcher |
| **RSK-06** | **Excessive False Alerts (Alert Fatigue)**<br/>Setting warning threshold too tightly (e.g. 7.5°C) floods dispatchers with non-critical warnings. | High | Medium | **MEDIUM** | Provide interactive threshold tuning experiment in UI; calculate empirical Precision, Recall, and F1-score; recommend balanced 8.0°C baseline. | Operations Lead |
| **RSK-07** | **Operator Manual Fallback Entry Errors**<br/>Driver or operator mistypes temperature (e.g., 45°C instead of 4.5°C) during manual fallback. | Medium | Medium | **MEDIUM** | Implement client-side and server-side range validation (0.0°C - 20.0°C); tag records as `source='MANUAL'`; require operator name and reason; append to immutable audit log. | Software Engineer |
| **RSK-08** | **Data Synchronization Conflicts**<br/>Out-of-order arrival of buffered readings conflicts with real-time operator overrides. | Low | Medium | **LOW** | Preserve unique UTC timestamps; maintain original raw stream separate from reconstructed series; record sync batch metadata. | Backend Engineer |
| **RSK-09** | **Tampering or Silent History Modification**<br/>Operator attempts to overwrite temperature history to avoid load rejection penalties. | Low | Critical | **CRITICAL** | Maintain append-only, immutable `audit_logs` table; prohibit `UPDATE` or `DELETE` on historical audit records; log old/new values with timestamps. | QA Compliance Director |
