import axios from 'axios';
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api'
).replace(/\/$/, '');
export const TOKEN_KEYS = { access: 'devpulse_access', refresh: 'devpulse_refresh' };

export const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ''),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const skipAuth = config.skipAuth === true;
  delete config.skipAuth;
  if (skipAuth) {
    if (config.headers) delete config.headers.Authorization;
    return config;
  }
  const token = sessionStorage.getItem(TOKEN_KEYS.access);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshingPromise = null;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retried && !original.url?.includes('/auth/token/')) {
      const refresh = sessionStorage.getItem(TOKEN_KEYS.refresh);
      if (!refresh) return Promise.reject(error);
      original._retried = true;
      try {
        if (!refreshingPromise) {
          refreshingPromise = axios.post(`${API_BASE_URL.replace(/\/$/, '')}/auth/token/refresh/`, { refresh }, { timeout: 12000 });
        }
        const response = await refreshingPromise;
        const nextAccess = response.data.access;
        sessionStorage.setItem(TOKEN_KEYS.access, nextAccess);
        if (response.data.refresh) sessionStorage.setItem(TOKEN_KEYS.refresh, response.data.refresh);
        original.headers.Authorization = `Bearer ${nextAccess}`;
        return api(original);
      } catch (refreshError) {
        sessionStorage.removeItem(TOKEN_KEYS.access);
        sessionStorage.removeItem(TOKEN_KEYS.refresh);
        window.dispatchEvent(new Event('devpulse:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        refreshingPromise = null;
      }
    }
    return Promise.reject(error);
  },
);

export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function errorMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || 'Something went wrong. Please try again.';
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data === 'string') return data;
  const first = Object.entries(data)[0];
  if (first) {
    const value = Array.isArray(first[1]) ? first[1][0] : first[1];
    return `${first[0]}: ${typeof value === 'string' ? value : 'Please check this field.'}`;
  }
  return 'Request failed. Please try again.';
}


// Collect every DRF page so lists do not silently stop at PAGE_SIZE (20).
export async function fetchAllPages(request, maxPages = 100) {
  const first = await request();
  if (Array.isArray(first.data)) return first.data;
  const rows = [...(Array.isArray(first.data?.results) ? first.data.results : [])];
  let next = first.data?.next;
  let pageCount = 1;
  while (next && pageCount < maxPages) {
    const response = await api.get(next);
    if (Array.isArray(response.data)) {
      rows.push(...response.data);
      break;
    }
    if (Array.isArray(response.data?.results)) rows.push(...response.data.results);
    next = response.data?.next;
    pageCount += 1;
  }
  return rows;
}
