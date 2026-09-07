// Centralized API Client for Dairy Cold-Chain System

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Handovers
  getHandovers: (params = {}) => {
    const q = new URLSearchParams();
    if (params.route_id) q.set('route_id', params.route_id);
    if (params.risk_level) q.set('risk_level', params.risk_level);
    if (params.search) q.set('search', params.search);
    if (params.limit) q.set('limit', params.limit);
    return request(`/handovers?${q.toString()}`);
  },
  getHandoverDetails: (id) => request(`/handovers/${id}`),
  reconstructHandover: (id, method = 'IMPROVED', user = 'Operations User') =>
    request(`/handovers/${id}/reconstruct`, {
      method: 'POST',
      body: JSON.stringify({ method, user, reason: `Manual trigger of ${method} reconstruction` }),
    }),

  // Sensors
  getSensors: (params = {}) => {
    const q = new URLSearchParams();
    if (params.handover_id) q.set('handover_id', params.handover_id);
    if (params.vehicle_id) q.set('vehicle_id', params.vehicle_id);
    if (params.source) q.set('source', params.source);
    if (params.limit) q.set('limit', params.limit || 100);
    return request(`/sensors?${q.toString()}`);
  },
  submitManualReading: (payload) =>
    request('/sensors/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Alerts
  getAlerts: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.severity) q.set('severity', params.severity);
    if (params.limit) q.set('limit', params.limit || 50);
    return request(`/alerts?${q.toString()}`);
  },
  acknowledgeAlert: (alertId, user = 'Operator', notes = '') =>
    request(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ user, notes }),
    }),

  // Audit
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams();
    if (params.user) q.set('user', params.user);
    if (params.entity) q.set('entity', params.entity);
    if (params.action) q.set('action', params.action);
    if (params.limit) q.set('limit', params.limit || 100);
    return request(`/audit?${q.toString()}`);
  },

  // Settings
  getThresholds: () => request('/settings/thresholds'),
  updateThreshold: (key, value, user = 'Admin', reason = 'Setting change') =>
    request('/settings/thresholds', {
      method: 'POST',
      body: JSON.stringify({ key, value: parseFloat(value), user, reason }),
    }),

  // Simulation
  getNetworkStatus: () => request('/simulate/network-status'),
  simulateNetworkOffline: (user = 'Operator') =>
    request('/simulate/network-offline', {
      method: 'POST',
      body: JSON.stringify({ user }),
    }),
  simulateNetworkOnline: (user = 'Operator') =>
    request('/simulate/network-online', {
      method: 'POST',
      body: JSON.stringify({ user }),
    }),
  simulateTempFailure: (handover_id = null, user = 'Operator') =>
    request('/simulate/temp-failure', {
      method: 'POST',
      body: JSON.stringify({ handover_id, user }),
    }),
  simulateGpsFailure: (handover_id = null, user = 'Operator') =>
    request('/simulate/gps-failure', {
      method: 'POST',
      body: JSON.stringify({ handover_id, user }),
    }),
  simulateCalibrationExpiry: (handover_id = null, user = 'Operator') =>
    request('/simulate/calibration-expiry', {
      method: 'POST',
      body: JSON.stringify({ handover_id, user }),
    }),
  simulateInjectGap: (duration_minutes = 15, handover_id = null, user = 'Operator') =>
    request('/simulate/inject-gap', {
      method: 'POST',
      body: JSON.stringify({ duration_minutes, handover_id, user }),
    }),
  resetDemoDataset: () =>
    request('/simulate/reset-demo', {
      method: 'POST',
    }),

  // Experiments
  getExperimentRuns: () => request('/experiments/runs'),
  getBaselineVsImproved: () => request('/experiments/baseline-vs-improved'),
  getThresholdTuning: () => request('/experiments/threshold-tuning'),
  getErrorAnalysis: () => request('/experiments/error-analysis'),
};
