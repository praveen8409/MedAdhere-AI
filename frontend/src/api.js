const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('medadhere_token') || '';
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('medadhere_token', token);
  else localStorage.removeItem('medadhere_token');
};

export const getStoredUser = () => {
  const userStr = localStorage.getItem('medadhere_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) localStorage.setItem('medadhere_user', JSON.stringify(user));
  else localStorage.removeItem('medadhere_user');
};

export const clearAuthSession = () => {
  localStorage.removeItem('medadhere_token');
  localStorage.removeItem('medadhere_user');
};

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('auth-session-expired'));
      }
    }

    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  // Auth & Onboarding
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getDemoAccounts: () => request('/auth/demo-accounts'),
  getChemists: () => request('/auth/chemists'),
  getMe: () => request('/auth/me'),
  forgotPassword: (emailOrUsername) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ emailOrUsername }) }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  // Dedicated Section Endpoints
  patientCaretakerSearch: (query = '') => request(`/patient/caretakers/search?query=${encodeURIComponent(query)}`),
  patientTakeDose: (scheduleId) => request(`/patient/dose/${scheduleId}/take`, { method: 'POST' }),
  patientPrescriptions: () => request('/patient/prescriptions'),
  caretakerChemists: () => request('/caretaker/chemists'),
  chemistQueue: () => request('/chemist/queue'),
  chemistDispatchOrder: (orderId) => request(`/chemist/order/${orderId}/dispatch`, { method: 'POST' }),
  chemistPatientsMin: () => request('/chemist/patients'),
  chemistHistory: () => request('/chemist/history'),

  // Multi-Patient & Chemist Binding
  getPatientsByCaretaker: (caretakerId) => request(`/users/caretakers/${caretakerId}/patients`),
  getAllPatients: () => request('/users/patients'),
  getPatientById: (patientId) => request(`/users/patients/${patientId}`),
  getPatientsByChemist: (chemistId) => request(`/users/chemists/${chemistId}/patients`),
  getAllCaretakers: () => request('/users/caretakers'),
  searchCaretakers: (query = '') => request(`/users/caretakers/search?query=${encodeURIComponent(query)}`),
  bindChemist: (patientId, chemistId) => request(`/users/patients/${patientId}/chemist`, { method: 'PUT', body: JSON.stringify({ chemistId }) }),

  // Caretaker Assignment & Clinical Governance Requests
  createAssignmentRequest: (data) => request('/assignment-requests', { method: 'POST', body: JSON.stringify(data) }),
  getCaretakerAssignmentRequests: (caretakerId) => request(`/assignment-requests/caretaker/${caretakerId}`),
  getPatientAssignmentRequests: (patientId) => request(`/assignment-requests/patient/${patientId}`),
  approveAssignmentRequest: (id, data) => request(`/assignment-requests/${id}/approve`, { method: 'PUT', body: JSON.stringify(data || {}) }),
  rejectAssignmentRequest: (id, reason) => request(`/assignment-requests/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),

  // Dashboard
  getDashboard: (patientId) => request('/dashboard' + (patientId ? `?patientId=${patientId}` : '')),

  // Medicines
  getMedicines: () => request('/medicines'),
  getMedicinesByPatient: (patientId) => request(`/medicines/patient/${patientId}`),
  createMedicine: (data) => request('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id, data) => request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedicine: (id) => request(`/medicines/${id}`, { method: 'DELETE' }),

  // Dose Schedules
  getSchedules: () => request('/schedules'),
  getSchedulesByPatient: (patientId) => request(`/schedules/patient/${patientId}`),
  markDoseTaken: (scheduleId) => request(`/schedules/${scheduleId}/taken`, { method: 'PUT' }),
  markDoseMissed: (scheduleId) => request(`/schedules/${scheduleId}/missed`, { method: 'PUT' }),
  resetSchedules: (patientId) => request(`/schedules/reset/${patientId}`, { method: 'POST' }),

  // Refill Orders
  getRefills: () => request('/refills'),
  getRefillsByPatient: (patientId) => request(`/refills/patient/${patientId}`),
  getRefillsByChemist: (chemistId) => request(`/refills/chemist/${chemistId}`),
  createRefill: (data) => request('/refills', { method: 'POST', body: JSON.stringify(data) }),
  updateRefillStatus: (orderId, status, notes = '') =>
    request(`/refills/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  // Notifications & Alerts
  getAlerts: () => request('/alerts'),
  getAlertsByCaretaker: (caretakerId) => request(`/alerts/caretaker/${caretakerId}`),
  getAlertsByPatient: (patientId) => request(`/alerts/patient/${patientId}`),
  resolveAlert: (alertId, notes = '', resolvedBy = '') =>
    request(`/alerts/${alertId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ notes, resolvedBy }),
    }),
  triggerEmergencySos: (patientId, reason = '') =>
    request('/alerts/sos', {
      method: 'POST',
      body: JSON.stringify({ patientId, reason }),
    }),
  getRecentNotifications: () => request('/notifications/recent'),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'PUT' }),

  // AI Pharmacist Copilot & Dynamic Advisor
  analyzeAdherence: (patientId) => request('/ai/analyze-adherence', { method: 'POST', body: JSON.stringify({ patientId }) }),
  checkInteractions: (patientId) => request('/ai/check-interactions', { method: 'POST', body: JSON.stringify({ patientId }) }),
  predictRefill: (patientId) => request('/ai/predict-refill', { method: 'POST', body: JSON.stringify({ patientId }) }),
  adviseAi: (data) => request('/ai/advise', { method: 'POST', body: JSON.stringify(data) }),
  chatAi: (data) => request('/ai/advise', { method: 'POST', body: JSON.stringify(data) }),
  executeAiAction: (data) => request('/ai/execute-action', { method: 'POST', body: JSON.stringify(data) }),

  // Audit Ledger & Chaos Simulators (Page 7)
  getAuditLogs: () => request('/audit/logs'),
  simulateChaosMissedDose: () => request('/audit/chaos/missed-dose', { method: 'POST' }),
  simulateChaosLowStock: () => request('/audit/chaos/low-stock', { method: 'POST' }),
  simulateChaosSos: () => request('/audit/chaos/emergency-sos', { method: 'POST' }),
  simulateChaosReset: () => request('/audit/chaos/reset', { method: 'POST' }),

  // Admin Supervisory Operations (ROLE_ADMIN)
  getAdminOverview: () => request('/admin/overview'),
  getAdminUsers: (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach(k => { if (params[k]) cleanParams[k] = params[k]; });
    const qs = new URLSearchParams(cleanParams).toString();
    return request('/admin/users' + (qs ? `?${qs}` : ''));
  },
  getAdminUserDossier: (userId) => request(`/admin/users/${userId}/dossier`),
  adminApproveUser: (userId) => request(`/admin/users/${userId}/approve`, { method: 'PUT' }),
  adminRejectUser: (userId, reason) => request(`/admin/users/${userId}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  adminBlockUser: (userId, reason) => request(`/admin/users/${userId}/block`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  adminUnblockUser: (userId) => request(`/admin/users/${userId}/unblock`, { method: 'PUT' }),
  getAdminAuditLogs: (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach(k => { if (params[k]) cleanParams[k] = params[k]; });
    const qs = new URLSearchParams(cleanParams).toString();
    return request('/admin/audit-logs' + (qs ? `?${qs}` : ''));
  },

  // Patient Health Telemetry & Vitals Mesh (Clinical Governance: Opt-in by Patient ONLY)
  getTelemetryStatus: (patientId) => request('/telemetry/status' + (patientId ? `/${patientId}` : '')),
  updateTelemetryConsent: (patientId, data) =>
    request('/telemetry/consent' + (patientId ? `/${patientId}` : ''), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordTelemetry: (patientId, data) =>
    request(`/telemetry/record/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  simulateTelemetrySync: (patientId) =>
    request(`/telemetry/sync/${patientId}`, {
      method: 'POST',
    }),
  getTelemetryHistory: (patientId) => request(`/telemetry/history/${patientId}`),
};

