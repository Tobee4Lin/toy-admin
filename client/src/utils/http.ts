import axios from 'axios';

const viteBase = String(import.meta.env.BASE_URL || '/');
const isPlatform = viteBase.startsWith('/app/');
const baseURL = isPlatform
  ? viteBase.replace(/\/$/, '')
  : (import.meta.env.VITE_API_BASE_URL || '');

function getAppBase(): string {
  if (viteBase && viteBase !== '/') return viteBase;
  return '/';
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const base = getAppBase().replace(/\/$/, '');
  window.location.assign(`${base}/login`);
}

export const http = axios.create({
  baseURL,
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);

export default http;
