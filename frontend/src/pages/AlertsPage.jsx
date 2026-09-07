import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

export default function AlertsPage({ onSelectHandover }) {
  const { role, refreshIndex, showToast, triggerRefresh } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [ackModalAlert, setAckModalAlert] = useState(null);
  const [ackNotes, setAckNotes] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts({
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        limit: 100,
      });
      setAlerts(data);
    } catch (err) {
      showToast('Failed to load alerts', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter, refreshIndex]);

  const handleAcknowledgeSubmit = async (e) => {
    e.preventDefault();
    if (!ackModalAlert) return;

    try {
      await api.acknowledgeAlert(ackModalAlert.id, `${role} User`, ackNotes);
      showToast(`Alert #${ackModalAlert.id} acknowledged`, 'success');
      setAckModalAlert(null);
      setAckNotes('');
      fetchAlerts();
      triggerRefresh();
    } catch (err) {
      showToast('Failed to acknowledge alert', 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
          Cold-Chain Hazard & Threshold Alerts
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Automated event alerts triggered by temperature limits (&gt;10°C), prolonged door openings, sensor voids, and expired calibration.
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{
              background: '#0d1322',
              color: 'white',
              border: '1px solid #1f2d47',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px'
            }}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: '#0d1322',
              color: 'white',
              border: '1px solid #1f2d47',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px'
            }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
          </select>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
          Showing <strong>{alerts.length}</strong> operational alerts
        </span>
      </div>

      {/* Alerts Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Loading alerts registry...
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#34d399' }}>
            ✓ No active alerts found matching filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Severity</th>
                  <th>Alert Code</th>
                  <th>Handover / Vehicle</th>
                  <th>Observed / Threshold</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Resolution / Owner</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {new Date(a.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td><StatusBadge type="severity" value={a.severity} /></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700' }}>{a.alert_type}</td>
                    <td>
                      {a.handover_id ? (
                        <button
                          onClick={() => onSelectHandover(a.handover_id)}
                          style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px', fontFamily: 'monospace' }}
                        >
                          {a.handover_id}
                        </button>
                      ) : (
                        <span style={{ color: '#64748b' }}>-</span>
                      )}
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{a.vehicle_id}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {a.value !== null ? `${a.value.toFixed(1)}` : '-'} / {a.threshold !== null ? `${a.threshold.toFixed(1)}` : '-'}
                    </td>
                    <td style={{ fontSize: '13px', color: '#cbd5e1' }}>{a.message}</td>
                    <td>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: a.status === 'ACTIVE' ? '#fb7185' : '#34d399'
                      }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {a.acknowledged_by ? (
                        <div>
                          <strong>{a.acknowledged_by}</strong>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            {new Date(a.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      {a.status === 'ACTIVE' && (
                        <button
                          onClick={() => {
                            setAckModalAlert(a);
                            setAckNotes('');
                          }}
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                        >
                          Acknowledge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acknowledge Modal */}
      {ackModalAlert && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2d47', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                Acknowledge Alert #{ackModalAlert.id}
              </h3>
              <button
                onClick={() => setAckModalAlert(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAcknowledgeSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                <strong>{ackModalAlert.alert_type}</strong>: {ackModalAlert.message}
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Action / Investigation Notes *
                </label>
                <textarea
                  rows="3"
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  placeholder="e.g., Contacted tanker driver; confirmed chilling unit reset; batch scheduled for acidity testing."
                  required
                  style={{
                    width: '100%',
                    background: '#0d1322',
                    border: '1px solid #1f2d47',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAckModalAlert(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Confirm Acknowledgement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
