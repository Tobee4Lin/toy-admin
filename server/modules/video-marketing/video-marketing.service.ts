import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../../database/sqlite-schema';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { DbType } from '../../database/db';
import { getMptClient, type MptVideoParams } from './mpt-client';

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
  startedAt: Date | number | null;
  completedAt: Date | number | null;
  createdAt: Date | number;
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
}

@Injectable()
export class VideoMarketingService {
  private readonly logger = new Logger('VideoMarketing');
  private pollingTasks = new Map<number, NodeJS.Timeout>();

  constructor(@Inject(DATABASE_PROVIDER) private db: DbType) {}

  /** 列出所有视频任务 */
  async findAll(status?: VideoTaskStatus): Promise<VideoTask[]> {
    const rows = status
      ? await this.db.select().from(schema.videoTask).where(eq(schema.videoTask.status, status)).orderBy(desc(schema.videoTask.createdAt))
      : await this.db.select().from(schema.videoTask).orderBy(desc(schema.videoTask.createdAt));
    return rows.map((r) => this.toTask(r));
  }

  /** 获取单个任务 */
  async findOne(id: number): Promise<VideoTask> {
    const rows = await this.db.select().from(schema.videoTask).where(eq(schema.videoTask.id, id)).limit(1);
    if (rows.length === 0) throw new NotFoundException('Video task not found');
    return this.toTask(rows[0]);
  }

  /** 创建视频任务并启动生成 */
  async create(dto: CreateVideoTaskDto): Promise<VideoTask> {
    const inserted = await this.db.insert(schema.videoTask).values({
      title: dto.title,
      subject: dto.subject,
      videoScript: dto.videoScript || null,
      aspectRatio: dto.aspectRatio || '9:16',
      voiceProvider: dto.voiceProvider || 'edge',
      voiceName: dto.voiceName || null,
      voiceLanguage: dto.voiceLanguage || 'en-US',
      voiceRate: dto.voiceRate || '1.0',
      subtitleEnabled: dto.subtitleEnabled !== false,
      bgmEnabled: dto.bgmEnabled !== false,
      materialSource: dto.materialSource || 'pexels',
      videoCount: dto.videoCount || 1,
      paragraphCount: dto.paragraphCount || 3,
      relatedProductId: dto.relatedProductId || null,
      status: 'pending',
      progress: 0,
      logs: JSON.stringify(['任务已创建，等待启动...']),
    }).returning();

    const task = this.toTask(inserted[0]);

    // 异步启动生成
    this.startGeneration(task.id).catch((err) => {
      this.logger.error(`Failed to start generation for task ${task.id}: ${err.message}`);
    });

    return task;
  }

  /** 启动视频生成（调用 MoneyPrinterTurbo API） */
  private async startGeneration(taskId: number): Promise<void> {
    const task = await this.findOne(taskId);
    const logs = [...(task.logs || []), '🚀 开始调用 MoneyPrinterTurbo API...'];

    try {
      const client = getMptClient(process.env.MPT_API_URL);

      // 检查服务可用性
      const healthy = await client.healthCheck();
      if (!healthy) {
        throw new Error('MoneyPrinterTurbo 服务未启动，请先启动 MPT API 服务 (python main.py)');
      }

      // 更新状态为生成中
      await this.updateTask(taskId, {
        status: 'generating',
        progress: 5,
        startedAt: new Date(),
        logs: [...logs, '✅ MPT 服务连接成功，提交生成任务...'],
      });

      // 构建参数（MPT 使用 snake_case 字段名）
      const params: MptVideoParams = {
        video_subject: task.subject,
        video_aspect: task.aspectRatio,
        video_count: task.videoCount,
        paragraph_number: task.paragraphCount,
        voice_name: task.voiceName || '',
        voice_rate: parseFloat(task.voiceRate || '1.0'),
        subtitle_enabled: task.subtitleEnabled,
        bgm_type: task.bgmEnabled ? 'random' : 'none',
        video_source: task.materialSource || 'pexels',
        video_language: task.voiceLanguage || 'en-US',
      };

      // 始终提供 video_script，避免 MPT 调用 LLM 生成脚本（需要 API Key）
      // 如果用户未填写自定义脚本，则根据主题自动生成一个简单脚本
      const script = task.videoScript || this.generateDefaultScript(task.subject, task.paragraphCount);
      params.video_script = script;
      // 同时提供素材关键词，避免调用 LLM 提取关键词
      const terms = this.extractKeywords(task.subject);
      params.video_terms = terms;

      const mptTaskId = await client.createVideo(params);
      this.logger.log(`MPT task created: ${mptTaskId}`);

      await this.updateTask(taskId, {
        mptTaskId,
        progress: 10,
        logs: [...(await this.getLogs(taskId)), `📋 MPT 任务ID: ${mptTaskId}，视频生成中...`],
      });

      // 启动轮询
      this.startPolling(taskId, mptTaskId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Generation failed for task ${taskId}: ${message}`);
      await this.updateTask(taskId, {
        status: 'failed',
        progress: 0,
        errorMessage: message,
        completedAt: new Date(),
        logs: [...(await this.getLogs(taskId)), `❌ 生成失败: ${message}`],
      });
    }
  }

  /** 轮询 MPT 任务状态 */
  private startPolling(taskId: number, mptTaskId: string): void {
    // 清除已有轮询
    const existing = this.pollingTasks.get(taskId);
    if (existing) clearInterval(existing);

    let consecutiveErrors = 0;
    const interval = setInterval(async () => {
      try {
        const client = getMptClient(process.env.MPT_API_URL);
        const result = await client.getTaskStatus(mptTaskId);
        consecutiveErrors = 0;

        const logs = await this.getLogs(taskId);
        const updateData: Partial<VideoTask> = {
          progress: result.progress,
        };

        if (result.status === 'completed') {
          updateData.status = 'completed';
          updateData.progress = 100;
          updateData.videoUrl = result.videos.length > 0 ? result.videos[0] : null;
          updateData.completedAt = new Date();
          updateData.logs = [...logs, '🎉 视频生成完成！'];
          clearInterval(interval);
          this.pollingTasks.delete(taskId);
        } else if (result.status === 'failed') {
          updateData.status = 'failed';
          updateData.errorMessage = result.error || '生成失败';
          updateData.completedAt = new Date();
          updateData.logs = [...logs, `❌ 生成失败: ${result.error || '未知错误'}`];
          clearInterval(interval);
          this.pollingTasks.delete(taskId);
        } else {
          updateData.logs = logs; // 不重复添加日志
        }

        await this.updateTask(taskId, updateData);
      } catch (err) {
        consecutiveErrors++;
        if (consecutiveErrors >= 10) {
          const message = err instanceof Error ? err.message : String(err);
          await this.updateTask(taskId, {
            status: 'failed',
            errorMessage: `轮询失败: ${message}`,
            completedAt: new Date(),
          });
          clearInterval(interval);
          this.pollingTasks.delete(taskId);
        }
      }
    }, 5000);

    this.pollingTasks.set(taskId, interval);
  }

  /** 手动刷新任务状态 */
  async refreshStatus(taskId: number): Promise<VideoTask> {
    const task = await this.findOne(taskId);
    // 如果没有 MPT 任务ID，说明之前创建失败，尝试重新提交
    if (!task.mptTaskId) {
      if (task.status === 'failed' || task.status === 'pending') {
        // 重新启动生成
        this.startGeneration(taskId).catch((err) => {
          this.logger.error(`Retry generation failed for task ${taskId}: ${err.message}`);
        });
        return this.findOne(taskId);
      }
      // 其他状态直接返回当前任务
      return task;
    }
    const client = getMptClient(process.env.MPT_API_URL);
    const result = await client.getTaskStatus(task.mptTaskId);

    const updateData: Partial<VideoTask> = {
      status: result.status as VideoTaskStatus,
      progress: result.progress ?? task.progress,
      videoUrl: result.videos.length > 0 ? result.videos[0] : task.videoUrl,
    };
    if (result.status === 'completed' && !task.completedAt) {
      updateData.completedAt = new Date();
    }
    if (result.status === 'failed') {
      updateData.errorMessage = result.error || task.errorMessage;
      updateData.completedAt = new Date();
    }

    await this.updateTask(taskId, updateData);
    return this.findOne(taskId);
  }

  /** 删除任务 */
  async delete(id: number): Promise<{ success: boolean }> {
    const interval = this.pollingTasks.get(id);
    if (interval) {
      clearInterval(interval);
      this.pollingTasks.delete(id);
    }
    await this.db.delete(schema.videoTask).where(eq(schema.videoTask.id, id));
    return { success: true };
  }

  /** 检查 MPT 服务状态 */
  async checkService(): Promise<{ available: boolean; baseUrl: string }> {
    const baseUrl = process.env.MPT_API_URL || 'http://127.0.0.1:8081';
    const client = getMptClient(baseUrl);
    const available = await client.healthCheck();
    return { available, baseUrl };
  }

  // --- 内部方法 ---

  private async getLogs(taskId: number): Promise<string[]> {
    const task = await this.findOne(taskId);
    return task.logs || [];
  }

  private async updateTask(id: number, data: Partial<VideoTask>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.videoScript !== undefined) updateData.videoScript = data.videoScript;
    if (data.aspectRatio !== undefined) updateData.aspectRatio = data.aspectRatio;
    if (data.voiceProvider !== undefined) updateData.voiceProvider = data.voiceProvider;
    if (data.voiceName !== undefined) updateData.voiceName = data.voiceName;
    if (data.voiceLanguage !== undefined) updateData.voiceLanguage = data.voiceLanguage;
    if (data.voiceRate !== undefined) updateData.voiceRate = data.voiceRate;
    if (data.subtitleEnabled !== undefined) updateData.subtitleEnabled = data.subtitleEnabled;
    if (data.bgmEnabled !== undefined) updateData.bgmEnabled = data.bgmEnabled;
    if (data.materialSource !== undefined) updateData.materialSource = data.materialSource;
    if (data.videoCount !== undefined) updateData.videoCount = data.videoCount;
    if (data.paragraphCount !== undefined) updateData.paragraphCount = data.paragraphCount;
    if (data.mptTaskId !== undefined) updateData.mptTaskId = data.mptTaskId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
    if (data.videoPath !== undefined) updateData.videoPath = data.videoPath;
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage;
    if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    if (data.logs !== undefined) updateData.logs = JSON.stringify(data.logs);

    await this.db.update(schema.videoTask).set(updateData).where(eq(schema.videoTask.id, id));
  }

  /** 根据主题自动生成默认脚本（跳过 LLM 调用） */
  private generateDefaultScript(subject: string, paragraphs: number): string {
    const cleanSubject = subject.trim();
    const lines: string[] = [];
    for (let i = 0; i < Math.max(1, paragraphs); i++) {
      if (i === 0) {
        lines.push(`Welcome to our showcase of ${cleanSubject}.`);
      } else if (i === 1) {
        lines.push(`Discover the quality and design that make our products stand out.`);
      } else if (i === 2) {
        lines.push(`Perfect for everyday use and gifting, trusted by customers worldwide.`);
      } else {
        lines.push(`Experience the difference with our premium selection.`);
      }
    }
    return lines.join('\n\n');
  }

  /** 从主题中提取素材关键词 */
  private extractKeywords(subject: string): string[] {
    // 移除常见停用词，提取有意义的名词作为素材搜索词
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'for', 'to', 'in', 'on', 'at', 'with',
      'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
      'fun', 'amazing', 'best', 'new', 'top', 'great', 'good', 'nice',
      'kids', 'children', 'child', 'baby', 'outdoor', 'indoor',
    ]);
    const words = subject.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
    // 去重并限制最多8个关键词
    const unique = [...new Set(words)];
    return unique.slice(0, 8);
  }

  private toTask(row: typeof schema.videoTask.$inferSelect): VideoTask {
    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      videoScript: row.videoScript,
      aspectRatio: row.aspectRatio as AspectRatio,
      voiceProvider: row.voiceProvider,
      voiceName: row.voiceName,
      voiceLanguage: row.voiceLanguage,
      voiceRate: row.voiceRate,
      subtitleEnabled: row.subtitleEnabled,
      bgmEnabled: row.bgmEnabled,
      materialSource: row.materialSource,
      videoCount: row.videoCount,
      paragraphCount: row.paragraphCount,
      relatedProductId: row.relatedProductId,
      mptTaskId: row.mptTaskId,
      status: row.status as VideoTaskStatus,
      progress: row.progress,
      videoUrl: row.videoUrl,
      videoPath: row.videoPath,
      coverUrl: row.coverUrl,
      duration: row.duration,
      errorMessage: row.errorMessage,
      logs: typeof row.logs === 'string' ? JSON.parse(row.logs || '[]') : (row.logs as string[]),
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
    };
  }
}
