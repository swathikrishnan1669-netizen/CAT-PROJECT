import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

export default function HandoversPage({ onSelectHandover }) {
  const { refreshIndex, showToast } = useApp();
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  useEffect(() => {
    const fetchHandovers = async () => {
      try {
        setLoading(true);
        const data = await api.getHandovers({
          search: search || undefined,
          route_id: routeFilter || undefined,
          risk_level: riskFilter || undefined,
          limit: 100,
        });
        setHandovers(data);
      } catch (err) {
        showToast('Failed to load handovers list', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchHandovers();
  }, [search, routeFilter, riskFilter, refreshIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
          Milk Handover Operations Registry
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Inspect individual milk collection handovers, sensor gap frequencies, reconstructed thermal curves, and exposure hazards.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="🔍 Search Handover ID or Producer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Route:</span>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            style={{
              background: '#0d1322',
              color: 'white',
              border: '1px solid #1f2d47',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px'
            }}
          >
            <option value="">All Routes</option>
            <option value="RT-01">RT-01 (Northern Chilling)</option>
            <option value="RT-02">RT-02 (Eastern Valley)</option>
            <option value="RT-03">RT-03 (Southern Pastures)</option>
            <option value="RT-04">RT-04 (Western Ridge)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Risk:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              background: '#0d1322',
              color: 'white',
              border: '1px solid #1f2d47',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px'
            }}
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
          Showing <strong>{handovers.length}</strong> handovers
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Loading handovers...
          </div>
        ) : handovers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No handovers matched the filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Handover ID</th>
                  <th>Producer Farm</th>
                  <th>Vehicle / Route</th>
                  <th>Transfer Window</th>
                  <th>Duration</th>
                  <th>Volume</th>
                  <th>Gaps</th>
                  <th>Confidence</th>
                  <th>Exposure Risk</th>
                  <th>Alerts</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {handovers.map((ho) => (
                  <tr key={ho.id}>
                    <td style={{ fontWeight: '700', fontFamily: 'monospace', color: '#38bdf8' }}>
                      {ho.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{ho.producer_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{ho.location}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{ho.vehicle_number}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{ho.route_name}</div>
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {new Date(ho.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(ho.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(ho.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontSize: '13px' }}>{ho.duration_minutes} min</td>
                    <td style={{ fontSize: '13px' }}>{Math.round(ho.milk_volume)} L</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: ho.total_gaps > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: ho.total_gaps > 0 ? '#fbbf24' : '#34d399',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {ho.total_gaps} gaps
                      </span>
                    </td>
                    <td><StatusBadge type="confidence" value={ho.overall_confidence} /></td>
                    <td><StatusBadge type="risk" value={ho.risk_level} /></td>
                    <td>
                      {ho.active_alerts > 0 ? (
                        <span style={{ color: '#fb7185', fontWeight: '700', fontSize: '12px' }}>
                          🚨 {ho.active_alerts}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => onSelectHandover(ho.id)}
                        className="btn btn-primary"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                      >
                        Inspect
                      </button>
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
