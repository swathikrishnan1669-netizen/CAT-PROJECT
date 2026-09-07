import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

export default function SensorDataPage() {
  const { refreshIndex, showToast } = useApp();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vehicleFilter, setVehicleFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        setLoading(true);
        const data = await api.getSensors({
          vehicle_id: vehicleFilter || undefined,
          source: sourceFilter || undefined,
          limit: 100,
        });
        setReadings(data);
      } catch (err) {
        showToast('Failed to load sensor stream', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchSensors();
  }, [vehicleFilter, sourceFilter, refreshIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
          Raw & Processed Sensor Telemetry Streams
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Real-time sensor telemetry logs ingested at 1-minute sampling intervals across collection vehicles and handover bays.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Vehicle:</span>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            style={{
              background: '#0d1322',
              color: 'white',
              border: '1px solid #1f2d47',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px'
            }}
          >
            <option value="">All Vehicles</option>
            <option value="VEH-01">VEH-01 (KA-04-E-1021)</option>
            <option value="VEH-02">VEH-02 (KA-04-E-2042)</option>
            <option value="VEH-03">VEH-03 (KA-04-E-3083)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              background: '#0d1322',
              color: 'white',
              border: '1px solid #1f2d47',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px'
            }}
          >
            <option value="">All Sources</option>
            <option value="ACTUAL">ACTUAL (Physical Sensor)</option>
            <option value="MANUAL">MANUAL (Operator Fallback)</option>
            <option value="SYNCHRONIZED">SYNCHRONIZED (Store & Forward)</option>
          </select>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
          Displaying latest <strong>{readings.length}</strong> telemetry packets
        </span>
      </div>

      {/* Telemetry Stream Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Ingesting sensor stream...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Vehicle</th>
                  <th>Handover ID</th>
                  <th>Temperature</th>
                  <th>Humidity</th>
                  <th>Door State</th>
                  <th>Network</th>
                  <th>Sensor Status</th>
                  <th>GPS / Coordinates</th>
                  <th>Battery</th>
                  <th>Source</th>
                  <th>Anomaly</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '600' }}>{r.vehicle_id}</td>
                    <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{r.handover_id || 'EN-ROUTE'}</td>
                    <td style={{ fontWeight: '700', color: r.temperature === null ? '#fbbf24' : r.temperature >= 8.0 ? '#fb7185' : '#34d399' }}>
                      {r.temperature !== null ? `${r.temperature.toFixed(1)}°C` : 'GAP (VOID)'}
                    </td>
                    <td>{r.humidity !== null ? `${r.humidity}%` : '-'}</td>
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
                    <td>
                      <span style={{ color: r.sensor_status === 'OK' ? '#34d399' : '#fb7185', fontWeight: '500' }}>
                        {r.sensor_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {r.location_available && r.latitude ? `${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)}` : '⚠ UNAVAILABLE'}
                    </td>
                    <td>{r.battery_status}%</td>
                    <td><StatusBadge type="source" value={r.source} /></td>
                    <td>
                      {r.is_noisy && <span className="badge badge-rose">SPIKE</span>}
                      {r.is_delayed && <span className="badge badge-amber">DELAY</span>}
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
