import React from 'react';

export default function UserGuidePage() {
  const sections = [
    {
      num: '1',
      title: 'Installation & Local Prerequisites',
      content: (
        <div>
          <p style={{ marginBottom: '8px' }}>
            The entire application is self-contained and runs locally without cloud dependencies.
          </p>
          <pre style={{ background: '#090d16', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#38bdf8' }}>
{`# 1. Install backend Python dependencies:
pip install -r requirements.txt

# 2. Local Node & NPM are pre-configured in tools/node/
# (or use system node/npm if installed)`}
          </pre>
        </div>
      ),
    },
    {
      num: '2',
      title: 'Starting the Backend Server',
      content: (
        <div>
          <p style={{ marginBottom: '8px' }}>
            The FastAPI server exposes all REST endpoints and automatically initializes the SQLite database with 7 days of realistic dairy data on first launch:
          </p>
          <pre style={{ background: '#090d16', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#38bdf8' }}>
{`python backend/main.py
# Server runs at: http://localhost:8000
# Interactive Swagger API docs: http://localhost:8000/docs`}
          </pre>
        </div>
      ),
    },
    {
      num: '3',
      title: 'Starting the Frontend Development Server',
      content: (
        <div>
          <p style={{ marginBottom: '8px' }}>
            Start the Vite development server with hot module reloading:
          </p>
          <pre style={{ background: '#090d16', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#38bdf8' }}>
{`cd frontend
npm run dev
# Dashboard launches at: http://localhost:5173`}
          </pre>
          <p style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
            Alternatively, when built via <code>npm run build</code>, the FastAPI backend will serve the entire frontend directly from <code>http://localhost:8000</code> with a single command!
          </p>
        </div>
      ),
    },
    {
      num: '4',
      title: 'Generating & Resetting Demo Data',
      content: (
        <div>
          <p>
            Click <strong>"🔄 Re-seed Data"</strong> on the top navigation bar at any time, or trigger <code>POST /api/simulate/reset-demo</code> to regenerate a clean 7-day multi-route, multi-producer dataset with ground-truth temperature curves and sensor degradation scenarios.
          </p>
        </div>
      ),
    },
    {
      num: '5',
      title: 'Inspecting Handover Operations',
      content: (
        <div>
          <p>
            Navigate to <strong>"Milk Handovers"</strong>. Use search or route filters to find any of the 140 handovers. Click <strong>"Inspect"</strong> to view the detailed timeline chart clearly separating:
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong style={{ color: '#10b981' }}>ACTUAL SENSOR DATA</strong> (Solid emerald line with circle points)</li>
            <li><strong style={{ color: '#f59e0b' }}>RECONSTRUCTED DATA</strong> (Amber dashed line with orange dots)</li>
            <li><strong style={{ color: '#c084fc' }}>MANUAL FALLBACK</strong> (Purple diamond markers)</li>
            <li><strong style={{ color: '#fb7185' }}>UNCERTAIN EXPOSURE PERIOD</strong> (Shaded red/amber risk bands)</li>
          </ul>
        </div>
      ),
    },
    {
      num: '6',
      title: 'Triggering Gap Reconstruction (Improved vs. Baseline)',
      content: (
        <div>
          <p>
            Inside any Handover Inspector view, click <strong>"✨ Run Improved Model"</strong> to execute the physics-informed contextual thermal reconstruction, or <strong>"Run Baseline"</strong> to execute forward-fill interpolation. The system automatically recalculates confidence scores, adjusts uncertain exposure durations, and appends a record to the audit ledger.
          </p>
        </div>
      ),
    },
    {
      num: '7',
      title: 'Simulating Real-World Failure Scenarios',
      content: (
        <div>
          <p>
            Visit <strong>"Failure Simulation"</strong> to execute real-time failure injection:
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Network Outage:</strong> Click "Drop Network". Watch the banner show <em>"X records waiting to sync"</em>. Click "Restore & Sync" to flush the queue into the database.</li>
            <li><strong>Temperature Sensor Failure:</strong> Simulates probe hardware disconnect; confidence score automatically decays.</li>
            <li><strong>GPS Satellite Lock Failure:</strong> Simulates location loss; activates dead-reckoning route fallback.</li>
            <li><strong>Expired Calibration:</strong> Simulates calibration certificate expiry; penalizes confidence by 45%.</li>
          </ul>
        </div>
      ),
    },
    {
      num: '8',
      title: 'Modifying Thresholds & Tuning Alerts',
      content: (
        <div>
          <p>
            Navigate to <strong>"Threshold Settings"</strong>. Adjust safety thresholds (e.g. warning temperature from 8.0°C to 7.5°C). Provide an operational justification and click <strong>"Update & Audit"</strong>. The change is immediately evaluated against live streams and logged into the immutable audit trail.
          </p>
        </div>
      ),
    },
    {
      num: '9',
      title: 'Auditing System Decisions',
      content: (
        <div>
          <p>
            Navigate to <strong>"Audit History"</strong>. View the tamper-proof ledger preserving every threshold change, manual operator entry, method switch, and network sync event with before/after diffs, actor timestamps, and justifications.
          </p>
        </div>
      ),
    },
    {
      num: '10',
      title: 'Running Scientific Experiments & Benchmarks',
      content: (
        <div>
          <p>
            Visit <strong>"Experiments & Benchmark"</strong> to inspect:
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Before vs. After Comparison:</strong> Head-to-head table showing MAE (0.85°C vs 0.28°C), RMSE, confidence, and false alert reductions.</li>
            <li><strong>Gap Experiments (5m, 15m, 30m, 60m):</strong> Empirical error curves under increasing sensor dropout durations.</li>
            <li><strong>Threshold Experiment:</strong> Specificity, Precision, Recall, and F1-score across 7.5°C, 8.0°C, and 8.5°C alert limits.</li>
            <li><strong>Error Analysis:</strong> Residual decomposition under door-open pumping vs closed transit.</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
          System User Guide & Operational Procedures
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Section 31: Comprehensive walkthrough for setup, navigation, reconstruction analysis, failure simulation, and regulatory auditing.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sections.map((sec) => (
          <div key={sec.num} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#0284c7',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: '700'
              }}>
                {sec.num}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc' }}>
                {sec.title}
              </h3>
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', paddingLeft: '40px' }}>
              {sec.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
