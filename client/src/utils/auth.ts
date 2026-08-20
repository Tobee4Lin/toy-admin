import { useQuery } from '@tanstack/react-query';
import http from './http';

function getAppBase(): string {
  const viteBase = String(import.meta.env.BASE_URL || '/');
  if (viteBase && viteBase !== '/') return viteBase;
  return '/';
}

export interface AdminProfile {
  id: number;
  username: string;
}

export async function login(username: string, password: string): Promise<{ accessToken: string }> {
  const res = await http.post('/api/auth/login', { username, password });
  return res.data;
}

export async function getProfile(): Promise<AdminProfile> {
  const res = await http.get('/api/auth/me');
  return res.data;
}

export function useCurrentAdmin() {
  return useQuery({
    queryKey: ['admin-profile'],
    queryFn: getProfile,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function logout() {
  localStorage.removeItem('admin_token');
  if (typeof window !== 'undefined') {
    const base = getAppBase().replace(/\/$/, '');
    window.location.assign(`${base}/login`);
  }
}
