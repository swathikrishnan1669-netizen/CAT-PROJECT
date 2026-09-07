import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage({ onSelectHandover }) {
  const { refreshIndex, showToast } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboardStats();
        setStats(res);
      } catch (err) {
        showToast('Failed to load dashboard statistics', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [refreshIndex]);

  const handleAcknowledge = async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId, 'Dashboard Operator', 'Acknowledged from dashboard overview');
      showToast('Alert acknowledged', 'success');
      const updated = await api.getDashboardStats();
      setStats(updated);
    } catch (err) {
      showToast('Failed to acknowledge alert', 'danger');
    }
  };

  if (loading || !stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        Loading dairy cold-chain analytics...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
            Operations Command Center
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Real-time dairy cold-chain telemetry, sensor gap reconstruction, and handover confidence monitoring.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Mean Handover Confidence:</span>
          <StatusBadge type="confidence" value={stats.average_confidence} />
        </div>
      </div>

      {/* Main KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <KpiCard
          title="Total Handovers"
          value={stats.total_handovers}
          subtitle="7-Day Multi-Route Volume"
          icon="🚚"
          color="blue"
        />
        <KpiCard
          title="Sensor Readings"
          value={stats.total_sensor_readings.toLocaleString()}
          subtitle="1-min Resolution Ingestion"
          icon="📡"
          color="teal"
        />
        <KpiCard
          title="Missing Gaps Detected"
          value={stats.missing_readings}
          subtitle="Telemetry voids identified"
          icon="⚠️"
          color="amber"
        />
        <KpiCard
          title="Reconstructed Readings"
          value={stats.reconstructed_readings}
          subtitle="Context-Aware Thermal Physics"
          icon="✨"
          color="emerald"
        />
        <KpiCard
          title="Uncertain Exposure"
          value={stats.uncertain_exposure_duration_minutes}
          unit="mins"
          subtitle="Cumulative risk exposure"
          icon="⏱️"
          color="rose"
        />
        <KpiCard
          title="Critical Alerts"
          value={stats.critical_alerts_count}
          subtitle="Excursions > 10.0°C"
          icon="🚨"
          color="rose"
        />
        <KpiCard
          title="Store & Forward Queue"
          value={stats.offline_sync_queue_count}
          subtitle="Buffered offline records"
          icon="📦"
          color="amber"
        />
        <KpiCard
          title="Manual Overrides"
          value={stats.manual_fallback_count}
          subtitle="Operator probe entries"
          icon="📝"
          color="purple"
        />
      </div>

      {/* Routes Risk Summary */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛣️</span> Collection Routes & Exposure Risk Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {stats.routes_risk_summary.map((r) => (
            <div
              key={r.route_id}
              style={{
                background: '#0d1527',
                border: `1px solid ${r.overall_status === 'CRITICAL' ? 'rgba(244, 63, 94, 0.4)' : r.overall_status === 'WARNING' ? 'rgba(245, 158, 11, 0.4)' : '#1f2d47'}`,
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>{r.route_name}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{r.route_id}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                <span>Handovers: <strong>{r.handovers_count}</strong></span>
                <span>Uncertain: <strong style={{ color: r.uncertain_exposure_minutes > 0 ? '#fb7185' : '#34d399' }}>{r.uncertain_exposure_minutes} min</strong></span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #1f2d47' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Route Status:</span>
                <StatusBadge type="risk" value={r.overall_status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚨</span> Recent Critical & Warning Cold-Chain Alerts
          </h3>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Auto-generated based on dynamic thresholds
          </span>
        </div>

        {stats.recent_alerts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#34d399', fontSize: '13px' }}>
            ✓ All cold-chain streams operating normally. Zero active alerts.
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alert Type</th>
                <th>Handover</th>
                <th>Message</th>
                <th>Observed / Threshold</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_alerts.map((a) => (
                <tr key={a.id}>
                  <td><StatusBadge type="severity" value={a.severity} /></td>
                  <td style={{ fontWeight: '600', fontSize: '12px', fontFamily: 'monospace' }}>{a.alert_type}</td>
                  <td>
                    <button
                      onClick={() => onSelectHandover(a.handover_id)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}
                    >
                      {a.handover_id}
                    </button>
                  </td>
                  <td style={{ fontSize: '13px', color: '#cbd5e1' }}>{a.message}</td>
                  <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    {a.value !== null ? `${a.value.toFixed(1)}` : 'N/A'} / {a.threshold !== null ? `${a.threshold.toFixed(1)}` : 'N/A'}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: a.status === 'ACTIVE' ? '#fb7185' : '#34d399'
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    {a.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAcknowledge(a.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
