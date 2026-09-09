import http from '@/utils/http';

export type VideoTaskStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
export type AspectRatio = '9:16' | '16:9' | '1:1';

export interface VideoTask {
  id: number;
  title: string;
  subject: string;
  videoScript: string | null;
  aspectRatio: AspectRatio;
  voiceProvider: string | null;
  voiceName: string | null;
  voiceLanguage: string | null;
  voiceRate: string | null;
  subtitleEnabled: boolean;
  bgmEnabled: boolean;
  materialSource: string | null;
  videoCount: number;
  paragraphCount: number;
  relatedProductId: number | null;
  mptTaskId: string | null;
  status: VideoTaskStatus;
  progress: number;
  videoUrl: string | null;
  videoPath: string | null;
  coverUrl: string | null;
  duration: number | null;
  errorMessage: string | null;
  logs: string[];
  startedAt: string | number | null;
  completedAt: string | number | null;
  createdAt: string | number;
}

export interface CreateVideoTaskDto {
  title: string;
  subject: string;
  videoScript?: string;
  aspectRatio?: AspectRatio;
  voiceProvider?: string;
  voiceName?: string;
  voiceLanguage?: string;
  voiceRate?: string;
  subtitleEnabled?: boolean;
  bgmEnabled?: boolean;
  materialSource?: string;
  videoCount?: number;
  paragraphCount?: number;
  relatedProductId?: number;
  localMaterials?: string[];
  clipDuration?: number;
}

export interface VideoMaterial {
  name: string;
  size: number;
  file: string;
}

export interface ServiceStatus {
  available: boolean;
  baseUrl: string;
}

export async function getVideoTasks(status?: VideoTaskStatus): Promise<VideoTask[]> {
  const res = await http.get('/api/video-marketing/tasks', { params: status ? { status } : {} });
  return res.data;
}

export async function getVideoTask(id: number): Promise<VideoTask> {
  const res = await http.get(`/api/video-marketing/tasks/${id}`);
  return res.data;
}

export async function createVideoTask(data: CreateVideoTaskDto): Promise<VideoTask> {
  const res = await http.post('/api/video-marketing/tasks', data);
  return res.data;
}

export async function refreshVideoTask(id: number): Promise<VideoTask> {
  const res = await http.post(`/api/video-marketing/tasks/${id}/refresh`);
  return res.data;
}

export async function deleteVideoTask(id: number): Promise<{ success: boolean }> {
  const res = await http.delete(`/api/video-marketing/tasks/${id}`);
  return res.data;
}

export async function checkMptService(): Promise<ServiceStatus> {
  const res = await http.get('/api/video-marketing/service/status');
  return res.data;
}

export async function uploadVideoMaterial(file: File): Promise<{ file: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await http.post('/api/video-marketing/materials/upload', formData);
  return res.data;
}

export async function listVideoMaterials(): Promise<VideoMaterial[]> {
  const res = await http.get('/api/video-marketing/materials');
  return res.data;
}
