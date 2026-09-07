import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StoreForwardBanner from './components/StoreForwardBanner';

import DashboardPage from './pages/DashboardPage';
import HandoversPage from './pages/HandoversPage';
import HandoverDetailsPage from './pages/HandoverDetailsPage';
import SensorDataPage from './pages/SensorDataPage';
import AlertsPage from './pages/AlertsPage';
import FailureSimulationPage from './pages/FailureSimulationPage';
import ExperimentsPage from './pages/ExperimentsPage';
import AuditHistoryPage from './pages/AuditHistoryPage';
import ThresholdSettingsPage from './pages/ThresholdSettingsPage';
import StakeholderValidationPage from './pages/StakeholderValidationPage';
import RiskRegisterPage from './pages/RiskRegisterPage';
import UserGuidePage from './pages/UserGuidePage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedHandoverId, setSelectedHandoverId] = useState('HO-0001');
  const { toast } = useApp();

  const handleSelectHandover = (id) => {
    setSelectedHandoverId(id);
    setActivePage('handover-details');
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onSelectHandover={handleSelectHandover} />;
      case 'handovers':
        return <HandoversPage onSelectHandover={handleSelectHandover} />;
      case 'handover-details':
        return <HandoverDetailsPage handoverId={selectedHandoverId} onSelectHandover={handleSelectHandover} />;
      case 'sensors':
        return <SensorDataPage />;
      case 'alerts':
        return <AlertsPage onSelectHandover={handleSelectHandover} />;
      case 'simulation':
        return <FailureSimulationPage onSelectHandover={handleSelectHandover} />;
      case 'experiments':
        return <ExperimentsPage />;
      case 'audit':
        return <AuditHistoryPage />;
      case 'settings':
        return <ThresholdSettingsPage />;
      case 'validation':
        return <StakeholderValidationPage />;
      case 'risk-register':
        return <RiskRegisterPage />;
      case 'user-guide':
        return <UserGuidePage />;
      default:
        return <DashboardPage onSelectHandover={handleSelectHandover} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div className="main-content">
        <Navbar />

        {/* Floating Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '76px',
              right: '24px',
              zIndex: 100,
              padding: '12px 20px',
              borderRadius: '8px',
              background: toast.type === 'success' ? '#065f46' : toast.type === 'danger' ? '#9f1239' : '#1e293b',
              color: '#f8fafc',
              border: `1px solid ${toast.type === 'success' ? '#10b981' : toast.type === 'danger' ? '#f43f5e' : '#38bdf8'}`,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <span>{toast.type === 'success' ? '✓' : toast.type === 'danger' ? '⚠' : 'ℹ'}</span>
            <span>{toast.message}</span>
          </div>
        )}

        <main className="page-body">
          <StoreForwardBanner />
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
