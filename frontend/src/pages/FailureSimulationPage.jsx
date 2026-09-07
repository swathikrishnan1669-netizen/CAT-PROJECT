import React, { useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function FailureSimulationPage({ onSelectHandover }) {
  const { role, networkStatus, setNetworkStatus, pendingSyncCount, setPendingSyncCount, showToast, triggerRefresh } = useApp();

  const [loadingAction, setLoadingAction] = useState(null);
  const [simulationLog, setSimulationLog] = useState([]);

  const runSimulation = async (actionKey, apiCall, label) => {
    setLoadingAction(actionKey);
    try {
      showToast(`Executing: ${label}...`, 'info');
      const res = await apiCall();
      showToast(`${label} executed successfully!`, 'success');
      
      setSimulationLog((prev) => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          label,
          response: res,
        },
        ...prev,
      ]);

      if (actionKey === 'net-offline') {
        setNetworkStatus('OFFLINE');
        setPendingSyncCount(res.pending_sync_count);
      } else if (actionKey === 'net-online') {
        setNetworkStatus('ONLINE');
        setPendingSyncCount(0);
      }

      triggerRefresh();
    } catch (err) {
      showToast(`Failed to execute ${label}`, 'danger');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
          Hardware & Connectivity Failure Simulation Lab
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Directly inject real-world IoT cold-chain failure cases into the active telemetry dataset and observe automated fallback, confidence decay, and store-and-forward resilience.
        </p>
      </div>

      {/* Grid of Simulation Triggers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Failure Case 1: Network Outage */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>📡</span>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                Failure Case 1: Cellular Network Outage
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              Simulates a 4G blackout while the vehicle is en-route through a mountain valley. Sensors continue sampling, buffering telemetry in the local SQLite store-and-forward queue.
            </p>
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: '#0d1322', fontSize: '12px', border: '1px solid #1f2d47' }}>
              Current Status: <strong style={{ color: networkStatus === 'ONLINE' ? '#34d399' : '#fbbf24' }}>{networkStatus}</strong> ({pendingSyncCount} records in sync queue)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => runSimulation('net-offline', () => api.simulateNetworkOffline(`${role} Tester`), 'Simulate Network Offline')}
              disabled={loadingAction !== null || networkStatus === 'OFFLINE'}
              className="btn btn-danger"
              style={{ flex: 1, fontSize: '12px' }}
            >
              {loadingAction === 'net-offline' ? 'Injecting...' : '⚠️ Drop Network'}
            </button>
            <button
              onClick={() => runSimulation('net-online', () => api.simulateNetworkOnline(`${role} Tester`), 'Simulate Network Recovery')}
              disabled={loadingAction !== null || networkStatus === 'ONLINE'}
              className="btn btn-success"
              style={{ flex: 1, fontSize: '12px' }}
            >
              {loadingAction === 'net-online' ? 'Restoring...' : '✓ Restore & Sync'}
            </button>
          </div>
        </div>

        {/* Failure Case 2: Temperature Sensor Failure */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>🌡️</span>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                Failure Case 2: Temperature Sensor Failure
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              Simulates thermal probe hardware detachment during a milk transfer. Voids readings for 12 minutes, triggers contextual thermal model, and drops confidence.
            </p>
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: '#0d1322', fontSize: '12px', border: '1px solid #1f2d47' }}>
              Expected: Fallback to ambient-correlation reconstruction &amp; reduced confidence score.
            </div>
          </div>

          <button
            onClick={() => runSimulation('temp-fail', () => api.simulateTempFailure(null, `${role} Tester`), 'Simulate Temp Sensor Failure')}
            disabled={loadingAction !== null}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '12px' }}
          >
            {loadingAction === 'temp-fail' ? 'Injecting Fault...' : '⚡ Trigger Temp Sensor Failure'}
          </button>
        </div>

        {/* Failure Case 3: GPS Failure */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>🛰️</span>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                Failure Case 3: GPS Satellite Lock Failure
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              Simulates GPS loss under tin-roof collection centers. Coordinate lock becomes null; activates dead-reckoning route waypoint mapping and logs a GPS alert.
            </p>
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: '#0d1322', fontSize: '12px', border: '1px solid #1f2d47' }}>
              Expected: `location_available=False`, GPS_UNAVAILABLE alert, 18% confidence penalty.
            </div>
          </div>

          <button
            onClick={() => runSimulation('gps-fail', () => api.simulateGpsFailure(null, `${role} Tester`), 'Simulate GPS Failure')}
            disabled={loadingAction !== null}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '12px' }}
          >
            {loadingAction === 'gps-fail' ? 'Injecting Lock Loss...' : '🛰️ Trigger GPS Lock Dropout'}
          </button>
        </div>

        {/* Failure Case 4: Calibration Expiry */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚖️</span>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                Failure Case 4: Expired Sensor Calibration
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              Simulates annual calibration certificate expiration on temperature sensor. Flags `calibration_status='EXPIRED'`, deducts 45% confidence, and generates alert.
            </p>
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: '#0d1322', fontSize: '12px', border: '1px solid #1f2d47' }}>
              Expected: CALIBRATION_EXPIRED warning alert &amp; confidence penalty.
            </div>
          </div>

          <button
            onClick={() => runSimulation('calib-fail', () => api.simulateCalibrationExpiry(null, `${role} Tester`), 'Simulate Calibration Expiry')}
            disabled={loadingAction !== null}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '12px' }}
          >
            {loadingAction === 'calib-fail' ? 'Expiring Certificate...' : '⏳ Trigger Calibration Expiry'}
          </button>
        </div>

        {/* Gap Generator 1: 15-Minute Sensor Gap */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>⏱️</span>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                Generate 15-Minute Sensor Void
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              Injects an intentional 15-minute missing gap into the active handover stream to benchmark contextual thermal bridge reconstruction against ground-truth.
            </p>
          </div>

          <button
            onClick={() => runSimulation('gap-15', () => api.simulateInjectGap(15, null, `${role} Tester`), 'Generate 15-Minute Gap')}
            disabled={loadingAction !== null}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '12px' }}
          >
            {loadingAction === 'gap-15' ? 'Injecting Gap...' : '➕ Inject 15-Min Gap'}
          </button>
        </div>

        {/* Gap Generator 2: 30-Minute Sensor Gap */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>⏳</span>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                Generate 30-Minute Sensor Void
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
              Injects a severe 30-minute sensor gap into the handover stream. Tests maximum allowable gap threshold (&gt;15 min limit) and uncertain exposure expansion.
            </p>
          </div>

          <button
            onClick={() => runSimulation('gap-30', () => api.simulateInjectGap(30, null, `${role} Tester`), 'Generate 30-Minute Gap')}
            disabled={loadingAction !== null}
            className="btn btn-danger"
            style={{ width: '100%', fontSize: '12px' }}
          >
            {loadingAction === 'gap-30' ? 'Injecting Gap...' : '🚨 Inject 30-Min Severe Gap'}
          </button>
        </div>
      </div>

      {/* Live Simulation Event Console */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💻</span> Live Failure Simulation Audit & Feedback Console
        </h3>

        {simulationLog.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            No simulations triggered in this session. Click any trigger button above to observe live state changes.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {simulationLog.map((log) => (
              <div
                key={log.id}
                style={{
                  background: '#0d1322',
                  border: '1px solid #1f2d47',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#38bdf8', fontSize: '13px' }}>{log.label}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{log.time}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#f8fafc' }}>
                  {log.response?.message || 'Action executed and verified.'}
                </div>
                {log.response?.handover_id && (
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Affected Handover:{' '}
                    <button
                      onClick={() => onSelectHandover(log.response.handover_id)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {log.response.handover_id} (Click to inspect in timeline)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
