import React from 'react';

export default function StatusBadge({ type, value }) {
  if (value === null || value === undefined) return null;

  const valStr = String(value).toUpperCase();

  // 1. Confidence Score Badges
  if (type === 'confidence') {
    const num = parseFloat(value);
    if (num >= 90) {
      return <span className="badge badge-emerald">● {num}% VERY HIGH</span>;
    } else if (num >= 75) {
      return <span className="badge badge-blue">● {num}% HIGH</span>;
    } else if (num >= 50) {
      return <span className="badge badge-amber">▲ {num}% MEDIUM</span>;
    } else {
      return <span className="badge badge-rose">⚠ {num}% LOW</span>;
    }
  }

  // 2. Risk Level Badges
  if (type === 'risk') {
    if (valStr === 'LOW') return <span className="badge badge-emerald">LOW RISK</span>;
    if (valStr === 'MEDIUM') return <span className="badge badge-amber">MEDIUM RISK</span>;
    if (valStr === 'HIGH') return <span className="badge badge-rose">HIGH RISK</span>;
    if (valStr === 'CRITICAL') return <span className="badge badge-rose" style={{ background: '#e11d48', color: 'white' }}>CRITICAL</span>;
    return <span className="badge badge-blue">{valStr}</span>;
  }

  // 3. Alert Severity Badges
  if (type === 'severity') {
    if (valStr === 'CRITICAL') return <span className="badge badge-rose">CRITICAL</span>;
    if (valStr === 'WARNING') return <span className="badge badge-amber">WARNING</span>;
    return <span className="badge badge-blue">INFO</span>;
  }

  // 4. Handover Status Badges
  if (type === 'handover_status') {
    if (valStr === 'COMPLETED') return <span className="badge badge-emerald">COMPLETED</span>;
    if (valStr === 'WARNING') return <span className="badge badge-amber">EXCURSION</span>;
    if (valStr === 'CRITICAL') return <span className="badge badge-rose">CRITICAL</span>;
    return <span className="badge badge-blue">{valStr}</span>;
  }

  // 5. Source Badges
  if (type === 'source') {
    if (valStr === 'ACTUAL') return <span className="badge badge-emerald">ACTUAL</span>;
    if (valStr === 'RECONSTRUCTED') return <span className="badge badge-amber">RECONSTRUCTED</span>;
    if (valStr === 'MANUAL') return <span className="badge badge-purple">MANUAL</span>;
    if (valStr === 'SYNCHRONIZED') return <span className="badge badge-blue">STORE & FORWARD</span>;
    return <span className="badge badge-blue">{valStr}</span>;
  }

  return <span className="badge badge-blue">{valStr}</span>;
}
