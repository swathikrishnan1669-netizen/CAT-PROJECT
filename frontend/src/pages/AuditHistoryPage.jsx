import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function AuditHistoryPage() {
  const { refreshIndex, showToast } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await api.getAuditLogs({
          user: userFilter || undefined,
          action: actionFilter || undefined,
          limit: 100,
        });
        setLogs(data);
      } catch (err) {
        showToast('Failed to load audit ledger', 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [userFilter, actionFilter, refreshIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
          Immutable Regulatory Audit Ledger
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Append-only historical record of all threshold adjustments, reconstruction method activations, manual overrides, and network synchronizations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔍 Filter by User / Actor..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{
              width: '100%',
              background: '#0d1322',
              border: '1px solid #1f2d47',
              borderRadius: '6px',
              padding: '7px 12px',
              color: 'white',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              background: '#0d1322',
              color: 'white',
              border: '1px solid #1f2d47',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px'
            }}
          >
            <option value="">All Actions</option>
            <option value="RECONSTRUCT_HANDOVER">RECONSTRUCT_HANDOVER</option>
            <option value="UPDATE_ALERT_THRESHOLD">UPDATE_ALERT_THRESHOLD</option>
            <option value="MANUAL_FALLBACK_ENTRY">MANUAL_FALLBACK_ENTRY</option>
            <option value="STORE_AND_FORWARD_SYNC">STORE_AND_FORWARD_SYNC</option>
            <option value="ACKNOWLEDGE_ALERT">ACKNOWLEDGE_ALERT</option>
            <option value="SIMULATE_NETWORK_OFFLINE">SIMULATE_NETWORK_OFFLINE</option>
            <option value="SIMULATE_TEMP_SENSOR_FAILURE">SIMULATE_TEMP_SENSOR_FAILURE</option>
            <option value="SIMULATE_GPS_FAILURE">SIMULATE_GPS_FAILURE</option>
            <option value="SIMULATE_CALIBRATION_EXPIRY">SIMULATE_CALIBRATION_EXPIRY</option>
          </select>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
          Preserving <strong>{logs.length}</strong> immutable transactions
        </span>
      </div>

      {/* Audit Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Reading audit ledger from database...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Timestamp</th>
                  <th>Actor / User</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Previous Value</th>
                  <th>Updated Value</th>
                  <th>Business / Operational Reason</th>
                  <th>Confidence Shift</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>
                      #{log.id}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '600', color: '#f1f5f9' }}>{log.user}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(2, 132, 199, 0.15)',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        fontWeight: '600'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      <strong>{log.entity}</strong>{' '}
                      <span style={{ color: '#64748b', fontFamily: 'monospace' }}>({log.entity_id})</span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#94a3b8' }}>{log.old_value || 'None'}</td>
                    <td style={{ fontSize: '12px', color: '#34d399', fontWeight: '600' }}>{log.new_value}</td>
                    <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{log.reason}</td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {log.confidence_after !== null ? (
                        <span style={{ color: '#38bdf8' }}>→ {log.confidence_after}%</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
