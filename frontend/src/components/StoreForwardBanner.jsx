import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function StoreForwardBanner() {
  const {
    networkStatus,
    setNetworkStatus,
    pendingSyncCount,
    setPendingSyncCount,
    showToast,
    triggerRefresh,
  } = useApp();

  const [syncState, setSyncState] = useState(null); // 'SYNCHRONIZING' | 'SUCCESS' | null
  const [syncedCountMessage, setSyncedCountMessage] = useState('');

  const handleTriggerSync = async () => {
    setSyncState('SYNCHRONIZING');
    try {
      // Step 1: Restore network
      const res = await api.simulateNetworkOnline('Operations Lead');
      setNetworkStatus('ONLINE');

      setTimeout(() => {
        setSyncState('SUCCESS');
        const count = res.sync_result?.synchronized_count || pendingSyncCount;
        setSyncedCountMessage(`${count} records successfully synchronized`);
        setPendingSyncCount(0);
        showToast(res.message || 'Store & Forward queue synchronized', 'success');
        triggerRefresh();

        setTimeout(() => {
          setSyncState(null);
        }, 5000);
      }, 1200);
    } catch (err) {
      setSyncState(null);
      showToast('Synchronization failed', 'danger');
    }
  };

  if (networkStatus === 'ONLINE' && pendingSyncCount === 0 && !syncState) {
    return null;
  }

  return (
    <div style={{
      margin: '0 24px 16px 24px',
      padding: '12px 18px',
      borderRadius: '10px',
      background: syncState === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
      border: `1px solid ${syncState === 'SUCCESS' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '13px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '18px' }}>
          {syncState === 'SYNCHRONIZING' ? '🔄' : syncState === 'SUCCESS' ? '✅' : '📡'}
        </span>
        <div>
          <strong style={{ color: syncState === 'SUCCESS' ? '#34d399' : '#fbbf24' }}>
            {syncState === 'SYNCHRONIZING'
              ? 'Synchronizing...'
              : syncState === 'SUCCESS'
              ? syncedCountMessage
              : `${pendingSyncCount} records waiting to sync (Network OFFLINE)`}
          </strong>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {syncState === 'SYNCHRONIZING'
              ? 'Reconciling buffered sensor packets with central SQLite database...'
              : syncState === 'SUCCESS'
              ? 'All offline records verified, timestamped, and logged to audit trail.'
              : 'Tanker telemetry is securely stored in local non-volatile flash queue.'}
          </div>
        </div>
      </div>

      <div>
        {networkStatus === 'OFFLINE' && syncState !== 'SYNCHRONIZING' && (
          <button
            onClick={handleTriggerSync}
            className="btn btn-success"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            ⚡ Restore Network & Sync Now
          </button>
        )}
      </div>
    </div>
  );
}
