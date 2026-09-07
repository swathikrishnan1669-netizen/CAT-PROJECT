import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import HandoverTimelineChart from '../components/HandoverTimelineChart';
import StatusBadge from '../components/StatusBadge';
import ManualFallbackModal from '../components/ManualFallbackModal';

export default function HandoverDetailsPage({ handoverId, onSelectHandover }) {
  const { role, showToast, refreshIndex, triggerRefresh } = useApp();

  const [handover, setHandover] = useState(null);
  const [allHandovers, setAllHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'readings' | 'uncertainty' | 'audit'
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isReconstructing, setIsReconstructing] = useState(false);

  // Load all handovers for the top selector
  useEffect(() => {
    api.getHandovers({ limit: 140 }).then(setAllHandovers).catch(() => {});
  }, []);

  const fetchDetails = async (id) => {
    try {
      setLoading(true);
      const data = await api.getHandoverDetails(id);
      setHandover(data);
    } catch (err) {
      showToast('Failed to load handover details', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const idToFetch = handoverId || allHandovers[0]?.id || 'HO-0001';
    fetchDetails(idToFetch);
  }, [handoverId, allHandovers.length, refreshIndex]);

  const handleRunReconstruction = async (method) => {
    if (!handover) return;
    setIsReconstructing(true);
    try {
      showToast(`Running ${method} gap reconstruction algorithm...`, 'info');
      const res = await api.reconstructHandover(handover.id, method, `${role} Persona`);
      showToast(`Reconstruction complete! Mean confidence: ${res.average_confidence}%`, 'success');
      fetchDetails(handover.id);
      triggerRefresh();
    } catch (err) {
      showToast('Reconstruction failed', 'danger');
    } finally {
      setIsReconstructing(false);
    }
  };

  if (loading && !handover) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        Loading handover telemetry...
      </div>
    );
  }

  if (!handover) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        Handover not found. Please select an operational handover.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Selector & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
              Handover Telemetry Inspector: {handover.id}
            </h2>
            <StatusBadge type="risk" value={handover.risk_level} />
            <StatusBadge type="confidence" value={handover.overall_confidence} />
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            {handover.producer.name} ({handover.location}) → {handover.vehicle.vehicle_number} on {handover.route.route_name}
          </p>
        </div>

        {/* Handover Switcher Dropdown & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={handover.id}
            onChange={(e) => onSelectHandover(e.target.value)}
            style={{
              background: '#0d1322',
              color: 'white',
              border: '1px solid #1f2d47',
              borderRadius: '6px',
              padding: '7px 12px',
              fontSize: '13px',
              fontFamily: 'monospace'
            }}
          >
            {allHandovers.map((h) => (
              <option key={h.id} value={h.id}>
                {h.id} - {h.producer_name} ({h.risk_level})
              </option>
            ))}
          </select>

          <button
            onClick={() => handleRunReconstruction('IMPROVED')}
            disabled={isReconstructing}
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '7px 14px' }}
          >
            {isReconstructing ? 'Reconstructing...' : '✨ Run Improved Model'}
          </button>

          <button
            onClick={() => handleRunReconstruction('BASELINE')}
            disabled={isReconstructing}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '7px 14px' }}
          >
            Run Baseline
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="btn"
            style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '12px', padding: '7px 14px' }}
          >
            📝 Manual Fallback
          </button>
        </div>
      </div>

      {/* Metadata Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Producer Farm</span>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginTop: '2px' }}>{handover.producer.name}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>GPS: {handover.latitude?.toFixed(3)}, {handover.longitude?.toFixed(3)}</div>
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Vehicle Tanker</span>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginTop: '2px' }}>{handover.vehicle.vehicle_number}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{handover.vehicle.insulation_rating}</div>
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Transfer Duration</span>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginTop: '2px' }}>{handover.duration_minutes} Minutes</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Volume: {Math.round(handover.milk_volume)} Liters</div>
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Sensor Gaps Detected</span>
          <div style={{ fontSize: '14px', fontWeight: '600', color: handover.gap_summary.missing_count > 0 ? '#fbbf24' : '#34d399', marginTop: '2px' }}>
            {handover.gap_summary.missing_count} Readings ({handover.reconstructed_readings.length} Reconstructed)
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Noisy: {handover.gap_summary.noisy_count} spikes</div>
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Uncertain Exposure</span>
          <div style={{ fontSize: '14px', fontWeight: '600', color: handover.uncertain_exposures.length > 0 ? '#fb7185' : '#34d399', marginTop: '2px' }}>
            {handover.uncertain_exposures.reduce((acc, u) => acc + u.duration_minutes, 0)} Mins Total
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Risk: {handover.risk_level}</div>
        </div>
      </div>

      {/* Main Interactive Timeline Chart Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
              📈 Handover Multi-Stream Temperature & Exposure Timeline
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Full chronological timeline visualizing sensor measurements, gap reconstructions, door events, and uncertain periods.
            </p>
          </div>
        </div>

        <HandoverTimelineChart
          sensorReadings={handover.sensor_readings}
          reconstructedReadings={handover.reconstructed_readings}
          uncertainExposures={handover.uncertain_exposures}
          warningThreshold={8.0}
          criticalThreshold={10.0}
        />
      </div>

      {/* Detail Tabs */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #1f2d47', background: '#0d1322' }}>
          {[
            { id: 'timeline', label: '📊 Telemetry Stream Records' },
            { id: 'uncertainty', label: `⚠️ Uncertain Exposure Windows (${handover.uncertain_exposures.length})` },
            { id: 'reconstructed', label: `✨ Reconstructed Readings (${handover.reconstructed_readings.length})` },
            { id: 'audit', label: `📜 Handover Audit Trail (${handover.audit_history.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === tab.id ? '600' : '400',
                borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : 'none',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px' }}>
          {/* Tab 1: Telemetry Stream Records */}
          {activeTab === 'timeline' && (
            <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Temp (°C)</th>
                    <th>Humidity</th>
                    <th>Door Status</th>
                    <th>Network</th>
                    <th>GPS Lock</th>
                    <th>Calibration</th>
                    <th>Source</th>
                    <th>Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {handover.sensor_readings.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: '700', color: r.temperature === null ? '#fbbf24' : r.temperature >= 8.0 ? '#fb7185' : '#34d399' }}>
                        {r.temperature !== null ? `${r.temperature.toFixed(1)}°C` : 'MISSING (GAP)'}
                      </td>
                      <td>{r.humidity ? `${r.humidity}%` : '-'}</td>
                      <td>
                        <span style={{ color: r.door_status === 'OPEN' ? '#fbbf24' : '#94a3b8', fontWeight: r.door_status === 'OPEN' ? '600' : '400' }}>
                          {r.door_status}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: r.network_status === 'ONLINE' ? '#34d399' : '#fbbf24' }}>
                          {r.network_status}
                        </span>
                      </td>
                      <td>{r.location_available ? '✓ Fixed' : '⚠ Lost'}</td>
                      <td>
                        <span style={{ color: r.calibration_status === 'VALID' ? '#34d399' : '#fb7185' }}>
                          {r.calibration_status}
                        </span>
                      </td>
                      <td><StatusBadge type="source" value={r.source} /></td>
                      <td>
                        {r.is_noisy && <span className="badge badge-rose">NOISE SPIKE</span>}
                        {r.is_delayed && <span className="badge badge-amber">DELAYED</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Uncertain Exposure Windows */}
          {activeTab === 'uncertainty' && (
            <div>
              {handover.uncertain_exposures.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#34d399' }}>
                  ✓ No uncertain exposure periods identified. Milk remained safely within confidence thresholds.
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Window (Start - End)</th>
                      <th>Duration</th>
                      <th>Est. Temp</th>
                      <th>Possible Range</th>
                      <th>Confidence</th>
                      <th>Risk Level</th>
                      <th>Operational Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {handover.uncertain_exposures.map((ue) => (
                      <tr key={ue.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {new Date(ue.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(ue.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontWeight: '700' }}>{ue.duration_minutes} min</td>
                        <td style={{ color: ue.estimated_temperature >= 8.0 ? '#fb7185' : '#fbbf24', fontWeight: '700' }}>
                          {ue.estimated_temperature.toFixed(1)}°C
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          [{ue.min_possible_temperature.toFixed(1)}°C - {ue.max_possible_temperature.toFixed(1)}°C]
                        </td>
                        <td><StatusBadge type="confidence" value={ue.confidence} /></td>
                        <td><StatusBadge type="risk" value={ue.risk_level} /></td>
                        <td style={{ color: '#cbd5e1', fontSize: '12px' }}>{ue.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 3: Reconstructed Readings */}
          {activeTab === 'reconstructed' && (
            <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Reconstructed (°C)</th>
                    <th>Confidence</th>
                    <th>Uncertainty Bounds</th>
                    <th>Method</th>
                    <th>Algorithmic Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {handover.reconstructed_readings.map((recon) => (
                    <tr key={recon.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {new Date(recon.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: '700', color: '#fbbf24' }}>
                        {recon.reconstructed_value.toFixed(1)}°C
                      </td>
                      <td><StatusBadge type="confidence" value={recon.confidence} /></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        [{recon.lower_bound}°C - {recon.upper_bound}°C]
                      </td>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>
                        {recon.method}
                      </td>
                      <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{recon.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 4: Handover Audit Trail */}
          {activeTab === 'audit' && (
            <div>
              {handover.audit_history.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  No historical alterations logged for this handover.
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Before / After</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {handover.audit_history.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {new Date(a.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: '600' }}>{a.user}</td>
                        <td style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px' }}>{a.action}</td>
                        <td style={{ fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>{a.old_value || 'None'}</span> →{' '}
                          <strong style={{ color: '#f8fafc' }}>{a.new_value}</strong>
                        </td>
                        <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{a.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual Fallback Modal */}
      <ManualFallbackModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        handover={handover}
        onSuccess={() => fetchDetails(handover.id)}
      />
    </div>
  );
}
