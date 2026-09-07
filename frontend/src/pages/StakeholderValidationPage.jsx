import React from 'react';

export default function StakeholderValidationPage() {
  const personas = [
    {
      role: 'Operations Manager',
      name: 'Suresh Kumar',
      org: 'Kolar Dairy Union',
      need: 'High-level risk triage without sifting through thousands of raw records; clear confidence score on each milk tanker load.',
      feedback: 'The handover timeline and confidence score immediately highlight which handovers require physical lab testing before unloading. The uncertain exposure duration (e.g. 14 mins at 8.7°C) gives my dispatchers actionable data to fast-track chilling.',
      result: 'VALIDATED',
      quote: 'Confidence score helps identify which handovers require investigation.'
    },
    {
      role: 'Quality Assurance (QA) Lead',
      name: 'Dr. Anita Rao',
      org: 'Food Safety & Compliance Bureau',
      need: 'Tamper-proof provenance that temperature remained <= 8.0°C; traceable records for regulatory compliance (FSSAI Chapter 4).',
      feedback: 'The immutable audit trail and explicit visual distinction between ACTUAL, RECONSTRUCTED, and MANUAL data is outstanding. Food safety auditors will not accept overwritten spreadsheets, but with this ledger and error bounds, we can defend our pasteurization safety decisions.',
      result: 'VALIDATED',
      quote: 'Audit history makes reconstructed readings traceable.'
    },
    {
      role: 'Fleet & Transport Manager',
      name: 'Vikram Singh',
      org: 'Apex Cold-Chain Logistics',
      need: 'Assurance that telemetry lost during cellular blackouts in rural valleys is not permanently destroyed.',
      feedback: 'Testing the Network Outage simulation demonstrated that records buffer locally in the tanker unit and synchronize cleanly once 4G resumes. Drivers no longer need to carry redundant duplicate paper logs.',
      result: 'VALIDATED',
      quote: 'Network outage simulation shows that data is not permanently lost.'
    },
    {
      role: 'Collection Centre Operator',
      name: 'Ramesh Gowda',
      org: 'Chintamani Chilling Center',
      need: 'Fast, straightforward fallback entry on a field tablet when a physical temperature probe is disconnected or broken.',
      feedback: 'Entering a manual reading took less than 15 seconds. Tagging it explicitly as MANUAL ensures I cannot be accused of falsifying telemetry charts, and the system immediately recalculates the handover risk profile.',
      result: 'VALIDATED',
      quote: 'Operator fallback form provides immediate operational continuity.'
    },
    {
      role: 'Cold-Chain Data Analyst',
      name: 'Meera Iyer',
      org: 'Supply Chain Optimization Group',
      need: 'Physics-informed, transparent thermal models rather than unexplainable black-box ML predictions.',
      feedback: 'The baseline vs. improved experiment view proves a 65% reduction in MAE during open-door transfers. The threshold experiment clearly demonstrates why 8.0°C provides the optimal balance between false alarms and critical detection.',
      result: 'VALIDATED',
      quote: 'Context-aware thermal model significantly reduces uncertainty bounds.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
          Stakeholder Needs & Operational Validation
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Simulated user acceptance testing evaluated against operational dairy collection union requirements.
        </p>
      </div>

      <div style={{ padding: '12px 18px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.3)', fontSize: '12px', color: '#38bdf8' }}>
        ℹ️ <strong>Section 29 Compliance Note:</strong> Simulated stakeholder validation personas representing actual commercial dairy union operating roles.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        {personas.map((p, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>{p.role}</h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.name} • {p.org}</div>
                </div>
                <span className="badge badge-emerald">
                  ✓ {p.result}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px' }}>
                <strong style={{ color: '#94a3b8' }}>Core Need:</strong> {p.need}
              </div>

              <div style={{
                background: '#0d1322',
                border: '1px solid #1f2d47',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#f1f5f9',
                fontStyle: 'italic',
                lineHeight: '1.5'
              }}>
                "{p.feedback}"
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#38bdf8', borderTop: '1px solid #1f2d47', paddingTop: '8px' }}>
              <strong>Key Validation:</strong> {p.quote}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
