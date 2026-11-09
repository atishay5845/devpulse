import { api } from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register/', payload),
  login: (payload) => api.post('/auth/token/', payload),
  me: () => api.get('/auth/me/'),
  updateMe: (payload) => api.patch('/auth/me/', payload),
};

export const projectsApi = {
  list: () => api.get('/projects/'),
  create: (payload) => api.post('/projects/', payload),
  update: (id, payload) => api.patch(`/projects/${id}/`, payload),
  remove: (id) => api.delete(`/projects/${id}/`),
};

export const monitorsApi = {
  list: (params) => api.get('/monitors/', { params }),
  create: (payload) => api.post('/monitors/', payload),
  get: (id) => api.get(`/monitors/${id}/`),
  update: (id, payload) => api.patch(`/monitors/${id}/`, payload),
  remove: (id) => api.delete(`/monitors/${id}/`),
  checks: (id) => api.get(`/monitors/${id}/checks/`),
  checkNow: (id) => api.post(`/monitors/${id}/check-now/`),
};

export const incidentsApi = {
  list: (params) => api.get('/incidents/', { params }),
  get: (id) => api.get(`/incidents/${id}/`),
  acknowledge: (id) => api.post(`/incidents/${id}/acknowledge/`),
  addNote: (id, message) => api.post(`/incidents/${id}/notes/`, { message }),
};

export const notificationsApi = {
  channels: () => api.get('/notification-channels/'),
  createChannel: (payload) => api.post('/notification-channels/', payload),
  updateChannel: (id, payload) => api.patch(`/notification-channels/${id}/`, payload),
  removeChannel: (id) => api.delete(`/notification-channels/${id}/`),
  logs: () => api.get('/notification-logs/'),
};

export const analyticsApi = {
  overview: (params) => api.get('/analytics/overview/', { params }),
  monitor: (id, period = '7d') => api.get(`/analytics/monitors/${id}/`, { params: { period } }),
};

export const statusPagesApi = {
  list: () => api.get('/status-pages/'),
  create: (payload) => api.post('/status-pages/', payload),
  update: (id, payload) => api.patch(`/status-pages/${id}/`, payload),
  remove: (id) => api.delete(`/status-pages/${id}/`),
  public: (slug) => api.get(`/public/status/${encodeURIComponent(slug)}/`, { skipAuth: true }),
};
