import React from 'react';

export default function RiskRegisterPage() {
  const risks = [
    {
      id: 'RSK-01',
      title: 'Incorrect Reconstruction During Long Gaps',
      description: 'Extended sensor voids (>30 min) during unmonitored door openings lead to underestimating milk temperature.',
      prob: 'Medium',
      impact: 'High',
      level: 'HIGH',
      mitigation: 'Apply exponential temporal confidence decay; expand upper uncertainty envelope [T_min, T_max]; flag any gap >15 min as an alert.',
      owner: 'Data Analyst / QA Manager'
    },
    {
      id: 'RSK-02',
      title: 'Overconfidence in Reconstructed Values',
      description: 'Operations staff treat reconstructed values as certified physical readings, neglecting physical inspection.',
      prob: 'Medium',
      impact: 'Critical',
      level: 'CRITICAL',
      mitigation: 'Enforce strict visual distinction on all charts (dashed lines, amber badges, clear labels); display explicit confidence scores; require manual review below 75% confidence.',
      owner: 'UX Designer / Operations Lead'
    },
    {
      id: 'RSK-03',
      title: 'Sensor Calibration Expiry & Thermal Drift',
      description: 'Aging thermistors drift upward/downward by 1.5°C without generating fatal hardware faults.',
      prob: 'High',
      impact: 'Medium',
      level: 'HIGH',
      mitigation: 'Track calibration dates in database; automatically penalize reading confidence by 45% when calibration is expired; fire proactive maintenance alerts.',
      owner: 'Fleet Maintenance Lead'
    },
    {
      id: 'RSK-04',
      title: 'Cellular Network Blackouts (Store-and-Forward Drop)',
      description: 'Rural transit corridors lose 4G connectivity, delaying real-time temperature visibility at headquarters.',
      prob: 'High',
      impact: 'Medium',
      level: 'MEDIUM',
      mitigation: 'Implement persistent SQLite local buffer; auto-synchronize on network recovery; mark delayed data with is_delayed=True and log sync events.',
      owner: 'IoT Hardware Engineer'
    },
    {
      id: 'RSK-05',
      title: 'GPS Satellite Lock Failure in Valleys',
      description: 'Tanker enters mountain pass; location coordinates become null, masking actual handover location.',
      prob: 'High',
      impact: 'Low',
      level: 'LOW',
      mitigation: 'Fallback to route waypoint schedule and last known good coordinate; flag location_available=False; apply 18% confidence penalty.',
      owner: 'Fleet Dispatcher'
    },
    {
      id: 'RSK-06',
      title: 'Excessive False Alerts (Alert Fatigue)',
      description: 'Setting warning threshold too tightly (e.g. 7.5°C) floods dispatchers with non-critical warnings.',
      prob: 'High',
      impact: 'Medium',
      level: 'MEDIUM',
      mitigation: 'Provide interactive threshold tuning experiment in UI; calculate empirical Precision, Recall, and F1-score; recommend balanced 8.0°C baseline.',
      owner: 'Operations Lead'
    },
    {
      id: 'RSK-07',
      title: 'Operator Manual Fallback Entry Errors',
      description: 'Driver or operator mistypes temperature (e.g., 45°C instead of 4.5°C) during manual fallback.',
      prob: 'Medium',
      impact: 'Medium',
      level: 'MEDIUM',
      mitigation: 'Implement client-side and server-side range validation (-5°C - 35°C); tag records as source="MANUAL"; require operator name and reason; append to immutable audit log.',
      owner: 'Software Engineer'
    },
    {
      id: 'RSK-08',
      title: 'Data Synchronization Conflicts',
      description: 'Out-of-order arrival of buffered readings conflicts with real-time operator overrides.',
      prob: 'Low',
      impact: 'Medium',
      level: 'LOW',
      mitigation: 'Preserve unique UTC timestamps; maintain original raw stream separate from reconstructed series; record sync batch metadata.',
      owner: 'Backend Engineer'
    },
    {
      id: 'RSK-09',
      title: 'Tampering or Silent History Modification',
      description: 'Operator attempts to overwrite temperature history to avoid load rejection penalties.',
      prob: 'Low',
      impact: 'Critical',
      level: 'CRITICAL',
      mitigation: 'Maintain append-only, immutable audit_logs table; prohibit UPDATE or DELETE on historical audit records; log old/new values with timestamps.',
      owner: 'QA Compliance Director'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
          Cold-Chain Operational & Algorithmic Risk Register
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Section 30: Detailed risk assessment covering sensor hardware, telemetry gaps, reconstruction confidence, human fallbacks, and regulatory compliance.
        </p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Risk ID</th>
                <th>Hazard Description</th>
                <th>Probability</th>
                <th>Impact</th>
                <th>Risk Level</th>
                <th>Mitigation Strategy</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>{r.id}</td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{r.description}</div>
                  </td>
                  <td>{r.prob}</td>
                  <td>{r.impact}</td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: r.level === 'CRITICAL' ? 'rgba(244, 63, 94, 0.2)' : r.level === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                      color: r.level === 'CRITICAL' ? '#fb7185' : r.level === 'HIGH' ? '#fbbf24' : '#38bdf8',
                      border: `1px solid ${r.level === 'CRITICAL' ? 'rgba(244, 63, 94, 0.4)' : r.level === 'HIGH' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(2, 132, 199, 0.4)'}`
                    }}>
                      {r.level}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{r.mitigation}</td>
                  <td style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{r.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
