import React from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function Navbar() {
  const {
    role,
    setRole,
    networkStatus,
    setNetworkStatus,
    pendingSyncCount,
    setPendingSyncCount,
    showToast,
    triggerRefresh,
  } = useApp();

  const handleResetDemo = async () => {
    if (!window.confirm('Reset and re-generate full 7-day dairy cold-chain demo dataset?')) return;
    try {
      showToast('Regenerating 7-day realistic dataset...', 'info');
      await api.resetDemoDataset();
      showToast('Dataset regenerated successfully!', 'success');
      triggerRefresh();
    } catch (err) {
      showToast('Failed to reset dataset', 'danger');
    }
  };

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #0284c7 0%, #14b8a6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          color: 'white',
          fontSize: '18px'
        }}>
          🥛
        </div>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Dairy Cold-Chain Sentinel
          </h1>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>
            Sensor Gap Reconstruction & Handover Confidence
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Network Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '20px',
          background: networkStatus === 'ONLINE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.15)',
          border: `1px solid ${networkStatus === 'ONLINE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.4)'}`,
          fontSize: '12px',
          fontWeight: '600',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: networkStatus === 'ONLINE' ? '#10b981' : '#f59e0b',
            boxShadow: networkStatus === 'ONLINE' ? '0 0 8px #10b981' : '0 0 10px #f59e0b',
          }} className={networkStatus === 'OFFLINE' ? 'pulse-sync' : ''} />
          <span style={{ color: networkStatus === 'ONLINE' ? '#34d399' : '#fbbf24' }}>
            {networkStatus === 'ONLINE' ? 'NETWORK: ONLINE' : `OFFLINE (${pendingSyncCount} QUEUED)`}
          </span>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Role:</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              showToast(`Switched active persona to ${e.target.value}`, 'info');
            }}
            style={{
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="OPERATIONS">Operations User</option>
            <option value="DATA_QUALITY">Data / Quality Lead</option>
            <option value="ADMIN">System Administrator</option>
          </select>
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleResetDemo}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '5px 12px' }}
          title="Regenerate 7-day realistic dataset"
        >
          🔄 Re-seed Data
        </button>

        <button
          onClick={triggerRefresh}
          className="btn btn-primary"
          style={{ fontSize: '12px', padding: '5px 12px' }}
          title="Fetch latest telemetry and status"
        >
          ⚡ Refresh
        </button>
      </div>
    </header>
  );
}
