import { http } from '@client/src/utils/http';

export interface MapsScraperTask {
  id: number;
  name: string;
  country: string;
  state?: string;
  city?: string;
  keyword: string;
  perArea: number;
  extractEmail: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  totalAreas: number;
  completedAreas: number;
  failedAreas: number;
  totalResults: number;
  logs: string[];
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
}

export interface MapsScraperResult {
  id: number;
  taskId: number;
  keyword?: string;
  industry?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  rating?: string;
  reviewsCount?: number;
  addedToCustomer: boolean;
  createdAt: number;
}

export interface MapsScraperPreset {
  id: number;
  name: string;
  country: string;
  state?: string;
  city?: string;
  keyword: string;
  perArea: number;
  extractEmail: boolean;
  createdAt: number;
}

export async function getTasks(): Promise<MapsScraperTask[]> {
  const res = await http.get('/api/maps-scraper/tasks');
  return res.data;
}

export async function getTask(id: number): Promise<MapsScraperTask> {
  const res = await http.get(`/api/maps-scraper/tasks/${id}`);
  return res.data;
}

export async function createTask(data: Partial<MapsScraperTask>): Promise<MapsScraperTask> {
  const res = await http.post('/api/maps-scraper/tasks', data);
  return res.data;
}

export async function startTask(id: number): Promise<MapsScraperTask> {
  const res = await http.post(`/api/maps-scraper/tasks/${id}/start`);
  return res.data;
}

export async function stopTask(id: number): Promise<MapsScraperTask> {
  const res = await http.post(`/api/maps-scraper/tasks/${id}/stop`);
  return res.data;
}

export async function deleteTask(id: number): Promise<{ success: boolean }> {
  const res = await http.delete(`/api/maps-scraper/tasks/${id}`);
  return res.data;
}

export async function getResults(taskId: number, search?: string): Promise<MapsScraperResult[]> {
  const res = await http.get(`/api/maps-scraper/tasks/${taskId}/results`, { params: search ? { search } : {} });
  return res.data;
}

export async function addResultToCustomer(id: number): Promise<MapsScraperResult> {
  const res = await http.post(`/api/maps-scraper/results/${id}/add-to-customer`);
  return res.data;
}

export async function deleteResult(id: number): Promise<{ success: boolean }> {
  const res = await http.delete(`/api/maps-scraper/results/${id}`);
  return res.data;
}

export async function getPresets(): Promise<MapsScraperPreset[]> {
  const res = await http.get('/api/maps-scraper/presets');
  return res.data;
}

export async function createPreset(data: Partial<MapsScraperPreset>): Promise<MapsScraperPreset> {
  const res = await http.post('/api/maps-scraper/presets', data);
  return res.data;
}

export async function deletePreset(id: number): Promise<{ success: boolean }> {
  const res = await http.delete(`/api/maps-scraper/presets/${id}`);
  return res.data;
}
