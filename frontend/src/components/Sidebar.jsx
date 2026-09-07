import React from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ activePage, setActivePage }) {
  const { activeAlertsCount } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: '📊' },
    { id: 'handovers', label: 'Milk Handovers', icon: '🚚' },
    { id: 'handover-details', label: 'Handover Inspector', icon: '🔍' },
    { id: 'sensors', label: 'Sensor Telemetry', icon: '📡' },
    { id: 'alerts', label: 'Alerts & Excursions', icon: '🚨', badge: activeAlertsCount > 0 ? activeAlertsCount : null },
    { id: 'simulation', label: 'Failure Simulation', icon: '🧪' },
    { id: 'experiments', label: 'Experiments & Benchmark', icon: '📈' },
    { id: 'audit', label: 'Audit History', icon: '📜' },
    { id: 'settings', label: 'Threshold Settings', icon: '⚙️' },
    { id: 'validation', label: 'Stakeholder Validation', icon: '👥' },
    { id: 'risk-register', label: 'Risk Register', icon: '🛡️' },
    { id: 'user-guide', label: 'System User Guide', icon: '📖' },
  ];

  return (
    <aside className="sidebar">
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #1f2d47' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
          Operations Navigation
        </span>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: isActive ? '#1e293b' : 'transparent',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#131b2e';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  background: '#f43f5e',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System info footer */}
      <div style={{ padding: '16px', borderTop: '1px solid #1f2d47', fontSize: '11px', color: '#64748b' }}>
        <div>Dairy Cold-Chain MVP v1.0</div>
        <div style={{ marginTop: '2px', color: '#0ea5e9' }}>Local SQLite & FastAPI Engine</div>
      </div>
    </aside>
  );
}
