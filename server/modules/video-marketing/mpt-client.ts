/**
 * MoneyPrinterTurbo API Client
 * 对接 MoneyPrinterTurbo 的 REST API
 * API 文档: http://127.0.0.1:8080/docs
 *
 * API 端点:
 *   POST /v1/videos          - 创建视频生成任务
 *   GET  /v1/tasks/{id}      - 查询任务状态
 *   GET  /v1/tasks           - 获取所有任务
 *   GET  /stream/{path}      - 视频流
 *   GET  /download/{path}    - 下载视频
 *
 * 任务状态 state:
 *   -1 = 失败
 *   1  = 完成
 *   4  = 处理中
 */

export interface MptVideoParams {
  video_subject: string;
  video_script?: string;
  video_aspect?: '16:9' | '9:16' | '1:1';
  video_count?: number;
  paragraph_number?: number;
  voice_name?: string;
  voice_rate?: number;
  voice_volume?: number;
  subtitle_enabled?: boolean;
  bgm_type?: string;
  bgm_volume?: number;
  video_source?: string;
  video_language?: string;
  video_materials?: Array<{ provider: string; url: string; duration?: number }>;
  video_clip_duration?: number;
  [key: string]: unknown;
}

export interface MptTaskResponse {
  status: number;
  message: string;
  data: {
    task_id: string;
    [key: string]: unknown;
  };
}

export interface MptTaskStatus {
  status: number;
  message: string;
  data: {
    task_id: string;
    state: number; // -1=failed, 1=complete, 4=processing
    progress: number;
    videos?: string[];
    combined_videos?: string[];
    failed_stage?: string;
    error?: string;
    [key: string]: unknown;
  };
}

export type MptStatus = 'pending' | 'generating' | 'completed' | 'failed';

export class MoneyPrinterTurboClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://127.0.0.1:8081', timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
  }

  /** 检查服务是否可用 */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/ping`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return true;
      // 如果 /ping 不存在，试试根路径
      const res2 = await fetch(`${this.baseUrl}/`, {
        signal: AbortSignal.timeout(5000),
      });
      return res2.ok;
    } catch {
      return false;
    }
  }

  /** 创建视频生成任务 */
  async createVideo(params: MptVideoParams): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`MoneyPrinterTurbo API error ${res.status}: ${text}`);
    }
    const data: MptTaskResponse = await res.json();
    if (data.status !== 200 || !data.data?.task_id) {
      throw new Error(`MoneyPrinterTurbo API error: ${data.message || 'Unknown error'}`);
    }
    return data.data.task_id;
  }

  /** 上传视频素材到 MPT（返回存储的文件名） */
  async uploadVideoMaterial(buffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)]);
    formData.append('file', blob, filename);
    const res = await fetch(`${this.baseUrl}/api/v1/video_materials`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`MPT upload error ${res.status}: ${text}`);
    }
    const data = await res.json() as { status: number; data: { file: string } };
    if (data.status !== 200 || !data.data?.file) {
      throw new Error(`MPT upload error: unexpected response ${JSON.stringify(data)}`);
    }
    return data.data.file;
  }

  /** 获取已上传的视频素材列表 */
  async listVideoMaterials(): Promise<Array<{ name: string; size: number; file: string }>> {
    const res = await fetch(`${this.baseUrl}/api/v1/video_materials`, {
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!res.ok) return [];
    const data = await res.json() as { status: number; data: { files: Array<{ name: string; size: number; file: string }> } };
    return data.data?.files || [];
  }

  /** 查询任务状态 */
  async getTaskStatus(taskId: string): Promise<{
    status: MptStatus;
    progress: number;
    videos: string[];
    error?: string;
  }> {
    const res = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}`, {
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`MoneyPrinterTurbo API error ${res.status}: ${text}`);
    }
    const data: MptTaskStatus = await res.json();
    if (data.status !== 200) {
      throw new Error(`MoneyPrinterTurbo API error: ${data.message}`);
    }

    const state = data.data.state;
    let status: MptStatus = 'generating';
    if (state === 1) status = 'completed';
    else if (state === -1) status = 'failed';

    const videos = data.data.videos || data.data.combined_videos || [];
    const videoUrls = videos.map((v) => {
      if (v.startsWith('http')) return v;
      return `${this.baseUrl}${v.startsWith('/') ? '' : '/'}${v}`;
    });

    return {
      status,
      progress: data.data.progress || 0,
      videos: videoUrls,
      error: data.data.error,
    };
  }
}

/** 默认单例 */
let defaultClient: MoneyPrinterTurboClient | null = null;

export function getMptClient(baseUrl?: string): MoneyPrinterTurboClient {
  if (baseUrl) {
    return new MoneyPrinterTurboClient(baseUrl);
  }
  if (!defaultClient) {
    defaultClient = new MoneyPrinterTurboClient(
      process.env.MPT_API_URL || 'http://127.0.0.1:8081',
    );
  }
  return defaultClient;
}
