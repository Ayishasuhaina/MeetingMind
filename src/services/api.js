/**
 * MeetingMind API service — centralized Axios-based API layer.
 * All frontend pages import from this file to talk to the FastAPI backend.
 * Reads base URL from VITE_API_BASE_URL (falls back to http://localhost:8000).
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Response interceptor — unwrap data, surface errors ───────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response) {
      const detail =
        error.response.data?.detail ||
        (typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data));
      return Promise.reject(new Error(detail || `HTTP ${error.response.status}`));
    }
    if (error.request) {
      return Promise.reject(new Error('Network error — is the backend running?'));
    }
    return Promise.reject(error);
  }
);

// ── Helpers ──────────────────────────────────────────────────────────────────
function clean(params) {
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

// ── Health ────────────────────────────────────────────────────────────────────
export const health = () => api.get('/api/health');

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// ── Meetings ──────────────────────────────────────────────────────────────────
export const getMeetings = (params = {}) =>
  api.get('/api/meetings', {
    params: clean({ page: 1, page_size: 100, sort_by: 'date', sort_order: 'desc', ...params }),
  });

export const getMeeting = (id) => api.get(`/api/meetings/${id}`);
export const createMeeting = (data) => api.post('/api/meetings', data);
export const updateMeeting = (id, data) => api.put(`/api/meetings/${id}`, data);
export const deleteMeeting = (id) => api.delete(`/api/meetings/${id}`);

// ── Action Items ──────────────────────────────────────────────────────────────
export const getActions = (params = {}) =>
  api.get('/api/actions', {
    params: clean({ page: 1, page_size: 100, sort_by: 'due_date', sort_order: 'asc', ...params }),
  });

export const createAction = (data) => api.post('/api/actions', data);
export const updateAction = (id, data) => api.put(`/api/actions/${id}`, data);
export const deleteAction = (id) => api.delete(`/api/actions/${id}`);

// ── Decisions ─────────────────────────────────────────────────────────────────
export const getDecisions = (params = {}) =>
  api.get('/api/decisions', {
    params: clean({ page: 1, page_size: 100, sort_by: 'decision_date', sort_order: 'desc', ...params }),
  });

export const createDecision = (data) => api.post('/api/decisions', data);
export const updateDecision = (id, data) => api.put(`/api/decisions/${id}`, data);
export const deleteDecision = (id) => api.delete(`/api/decisions/${id}`);

// ── Search ────────────────────────────────────────────────────────────────────
export const globalSearch = (q, types, limit = 20) =>
  api.get('/api/search', { params: clean({ q, types, limit }) });

// ── Reports ───────────────────────────────────────────────────────────────────
export const getReportSummary = (params = {}) =>
  api.get('/api/reports/summary', { params: clean(params) });

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (unreadOnly = false) =>
  api.get('/api/notifications', { params: unreadOnly ? { unread_only: true } : {} });

export const markNotificationsRead = (ids = null) =>
  api.put('/api/notifications/read', { notification_ids: ids });

export const deleteNotification = (id) => api.delete(`/api/notifications/${id}`);

// ── CSV Export ─────────────────────────────────────────────────────────────────
export function downloadCSV(type) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const url = `${baseURL}/api/export/${type}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `meetingmind-${type}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Extraction ────────────────────────────────────────────────────────────────
export { parseFile, processTranscript, approveExtraction, reprocessMeeting } from './extractionApi';

// Export the axios instance for custom use
export default api;
