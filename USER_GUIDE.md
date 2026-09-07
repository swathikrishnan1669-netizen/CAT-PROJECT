# USER GUIDE

## Dairy Cold-Chain Sensor Gap Reconstruction & Handover Confidence System

Welcome to the **Dairy Cold-Chain Sentinel** prototype. This operational guide provides complete instructions for installing, launching, operating, testing, and auditing the system.

---

## 1. How to Install

The project is designed to be self-contained and run locally on Windows or Linux with zero cloud configuration.

### Prerequisites:
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (a portable Node.js runtime is pre-configured in `tools/node/`)

### Setup Command:
```powershell
# In the project root directory:
pip install -r requirements.txt
```

---

## 2. How to Start the Backend Server

Start the FastAPI application:
```powershell
python backend/main.py
```
- **API Server Address**: `http://localhost:8000`
- **Interactive OpenAPI / Swagger Documentation**: `http://localhost:8000/docs`
- **SQLite Database**: Automatically initialized at `data/generated/dairy_cold_chain.db`

*Note*: On initial boot, the backend automatically seeds a 7-day multi-producer, multi-vehicle, multi-route dataset with realistic sensor noise and dropouts.

---

## 3. How to Start the Frontend

You can run the frontend in either Development Mode or Unified Production Mode:

### Option A: Development Mode (Hot-Reloading via Vite)
```powershell
cd frontend
..\tools\node\npm.cmd run dev
# Dashboard launches at http://localhost:5173
```

### Option B: Unified Mode (FastAPI Serves the Built React SPA)
```powershell
cd frontend
..\tools\node\npm.cmd run build
cd ..
python backend/main.py
# Open http://localhost:8000 in your browser!
```

---

## 4. How to Generate & Reset Demo Data

At any time, you can reset the active state to a pristine 7-day realistic synthetic dataset:
1. Click the **"🔄 Re-seed Data"** button located on the top navigation bar.
2. Confirm the prompt.
3. The backend generates 140 handovers across 10 producers, 3 vehicles, and 4 routes with calibrated ground-truth curves, 5m/15m/30m/60m gaps, noisy spikes, and recalculates benchmarks.

---

## 5. How to Inspect Handovers

1. Click on **"Milk Handovers"** in the sidebar.
2. Use the search box or filter dropdowns (by Route or Risk Level).
3. Click the **"Inspect"** button on any handover row (e.g. `HO-0001` or `HO-0002`).
4. In the **Handover Inspector**, examine the high-resolution multi-stream timeline chart:
   - **Solid Emerald Line (`#10b981`)**: Actual calibrated sensor telemetry.
   - **Dashed Amber Line (`#f59e0b`)**: Reconstructed temperature points.
   - **Purple Diamond Markers (`#c084fc`)**: Operator manual fallback observations.
   - **Shaded Translucent Red/Amber Bands**: Quantified Uncertain Exposure periods.
   - Hover over any point to inspect temperature, bounds, confidence score, and algorithmic rationale.

---

## 6. How to Run Gap Reconstruction

1. Open any handover in the **Handover Inspector**.
2. Click **"✨ Run Improved Model"** to run context-aware physics reconstruction (modeling ambient diurnal heat gain, door convective coefficient $k_{\text{door}}$, and vehicle insulation recovery).
3. Alternatively, click **"Run Baseline"** to observe zero-context forward fill and linear interpolation.
4. Notice how the mean confidence score, uncertainty envelopes, and risk levels adjust dynamically.
5. All reconstruction runs are automatically appended to the immutable audit trail.

---

## 7. How to Simulate Failures

Navigate to **"Failure Simulation"** to trigger live operational failures:
1. **Network Outage Simulation**:
   - Click **"⚠️ Drop Network"**.
   - Watch the top banner display: *"5 records waiting to sync (Network OFFLINE)"*.
   - Click **"✓ Restore & Sync"**.
   - Notice the status transition: *"Synchronizing..."* $\rightarrow$ *"5 records successfully synchronized"*.
2. **Temperature Sensor Hardware Failure**:
   - Click **"⚡ Trigger Temp Sensor Failure"**.
   - Sensor probe readings are voided for 12 minutes on the active handover; contextual fallback activates and confidence drops.
3. **GPS Satellite Lock Loss**:
   - Click **"🛰️ Trigger GPS Lock Dropout"**.
   - Location is flagged as unavailable; dead-reckoning route waypoint mapping is engaged.
4. **Calibration Expiry**:
   - Click **"⏳ Trigger Calibration Expiry"**.
   - Calibration status flips to `EXPIRED`; confidence is penalized by 45% and an alert is logged.
5. **Inject 15-Minute / 30-Minute Gaps**:
   - Click either gap injection button to introduce controlled voids for algorithm stress testing.

---

## 8. How to Modify Thresholds & Tune Alerts

1. Click on **"Threshold Settings"** in the sidebar.
2. Select an active threshold (e.g. `temp_warning` from 8.0°C to 7.5°C, or `gap_max_minutes` from 15 min to 10 min).
3. Provide an operational justification (e.g. *"Summer heatwave SOP update"*).
4. Click **"💾 Update & Audit"**.
5. The alert engine evaluates the new limit against all streams, adjusts active alerts, and records the change in the audit ledger.

---

## 9. How to View Audit Logs

1. Click on **"Audit History"** in the sidebar.
2. Review the chronological, tamper-proof event ledger.
3. Filter by User or Action (e.g. `UPDATE_ALERT_THRESHOLD`, `MANUAL_FALLBACK_ENTRY`, `STORE_AND_FORWARD_SYNC`).
4. Inspect the previous state, new state, actor name, timestamp, and justification.

---

## 10. How to Run Scientific Experiments & Benchmarks

Navigate to **"Experiments & Benchmark"**:
- **Before vs. After Comparison**: Directly compares Mean Absolute Error (MAE: 0.85°C vs 0.28°C), RMSE, confidence, and false alert rates.
- **Gap Duration Benchmarks**: Inspect Experiments A (5m), B (15m), C (30m), and D (60m).
- **Threshold Sensitivity Experiment**: Review Precision, Recall, and F1-score across 7.5°C, 8.0°C, and 8.5°C alert boundaries.
- **Algorithmic Error Analysis**: Inspect door-open vs door-closed residuals and read root-cause explanations for worst-case conditions.

---

## 11. Automated Test Suite Execution

To run the complete automated test suite (22 unit and integration tests):
```powershell
python -m pytest backend/tests/ -v
```
All tests verify gap detection, baseline vs improved reconstruction, confidence decay, uncertain exposure, alert generation, store-and-forward, manual fallback, and REST endpoints.
