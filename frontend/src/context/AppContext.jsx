import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [role, setRole] = useState('OPERATIONS'); // 'OPERATIONS', 'DATA_QUALITY', 'ADMIN'
  const [networkStatus, setNetworkStatus] = useState('ONLINE');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((curr) => (curr?.id === toast?.id ? null : curr));
    }, 4000);
  };

  const triggerRefresh = () => {
    setRefreshIndex((prev) => prev + 1);
  };

  // Poll network status & alerts every 6 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const net = await api.getNetworkStatus();
        setNetworkStatus(net.status);
        setPendingSyncCount(net.pending_sync_count);

        const stats = await api.getDashboardStats();
        setActiveAlertsCount(stats.critical_alerts_count + stats.warning_alerts_count);
      } catch (err) {
        // Silent fail in polling
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 6000);
    return () => clearInterval(interval);
  }, [refreshIndex]);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        networkStatus,
        setNetworkStatus,
        pendingSyncCount,
        setPendingSyncCount,
        syncMessage,
        setSyncMessage,
        activeAlertsCount,
        toast,
        showToast,
        refreshIndex,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
