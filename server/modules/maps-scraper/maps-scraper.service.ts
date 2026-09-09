import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import * as schema from '../../database/sqlite-schema';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { DbType } from '../../database/db';
import { GoogleMapsScraper } from './google-maps.scraper';

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
  startedAt?: Date | number;
  completedAt?: Date | number;
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
  latitude?: string;
  longitude?: string;
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

const COMPANY_PREFIXES = ['Premium', 'Global', 'Royal', 'Sunrise', 'Golden', 'Silver', 'Elite', 'Prime', 'Apex', 'Vertex', 'Nova', 'Atlas', 'Zenith', 'Summit', 'Horizon'];
const COMPANY_SUFFIXES = ['Toys Co.', 'Toy Distributors', 'Play World', 'Kids Supply', 'Toy Traders', 'Import & Export', 'Wholesale Ltd.', 'Trading Inc.', 'Industries', 'Group'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Dubai', 'Riyadh', 'Jeddah', 'Sao Paulo', 'Rio de Janeiro', 'Mexico City', 'Guadalajara', 'Bogota', 'Lima', 'Santiago', 'London', 'Paris', 'Berlin', 'Madrid', 'Rome'];
const STREETS = ['Main St', 'Broadway', 'Market Rd', 'Industrial Ave', 'Commerce Blvd', 'Trade Center', 'Business Park', 'Port Rd'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockResults(task: MapsScraperTask, count: number): Partial<MapsScraperResult>[] {
  const results: Partial<MapsScraperResult>[] = [];
  for (let i = 0; i < count; i++) {
    const prefix = randomItem(COMPANY_PREFIXES);
    const suffix = randomItem(COMPANY_SUFFIXES);
    const city = task.city && task.city !== '全部' ? task.city : randomItem(CITIES);
    results.push({
      taskId: task.id,
      keyword: task.keyword,
      industry: task.keyword,
      name: `${prefix} ${suffix}`,
      address: `${Math.floor(Math.random() * 999) + 1} ${randomItem(STREETS)}`,
      city,
      state: task.state || 'CA',
      zipCode: String(Math.floor(Math.random() * 90000) + 10000),
      phone: `+${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      whatsapp: `+${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
      email: `info@${prefix.toLowerCase()}${suffix.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      website: `https://www.${prefix.toLowerCase()}${suffix.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviewsCount: Math.floor(Math.random() * 500) + 10,
    });
  }
  return results;
}

@Injectable()
export class MapsScraperService {
  constructor(@Inject(DATABASE_PROVIDER) private db: DbType) {}

  // Task CRUD
  async findAllTasks(): Promise<MapsScraperTask[]> {
    const rows = await this.db.select().from(schema.mapsScraperTask).orderBy(desc(schema.mapsScraperTask.createdAt));
    return rows.map((r) => this.toTask(r));
  }

  async findTask(id: number): Promise<MapsScraperTask> {
    const [row] = await this.db.select().from(schema.mapsScraperTask).where(eq(schema.mapsScraperTask.id, id));
    if (!row) throw new NotFoundException('Task not found');
    return this.toTask(row);
  }

  async createTask(data: Partial<MapsScraperTask>): Promise<MapsScraperTask> {
    const [row] = await this.db.insert(schema.mapsScraperTask).values({
      name: data.name || `${data.keyword} - ${data.country}`,
      country: data.country!,
      state: data.state,
      city: data.city,
      keyword: data.keyword!,
      perArea: data.perArea ?? 10,
      extractEmail: data.extractEmail ?? true,
      status: 'pending',
    }).returning();
    return this.toTask(row);
  }

  async updateTask(id: number, data: Partial<MapsScraperTask>): Promise<MapsScraperTask> {
    const updateData: Record<string, any> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.totalAreas !== undefined) updateData.totalAreas = data.totalAreas;
    if (data.completedAreas !== undefined) updateData.completedAreas = data.completedAreas;
    if (data.failedAreas !== undefined) updateData.failedAreas = data.failedAreas;
    if (data.totalResults !== undefined) updateData.totalResults = data.totalResults;
    if (data.logs !== undefined) updateData.logs = JSON.stringify(data.logs);
    if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    const [row] = await this.db.update(schema.mapsScraperTask).set(updateData).where(eq(schema.mapsScraperTask.id, id)).returning();
    if (!row) throw new NotFoundException('Task not found');
    return this.toTask(row);
  }

  async deleteTask(id: number): Promise<{ success: boolean }> {
    await this.db.delete(schema.mapsScraperResult).where(eq(schema.mapsScraperResult.taskId, id));
    await this.db.delete(schema.mapsScraperTask).where(eq(schema.mapsScraperTask.id, id));
    return { success: true };
  }

  // Real Google Maps scraping with Playwright
  private runningTasks = new Map<number, { stop: boolean }>();
  private readonly logger = new Logger('MapsScraperService');

  async startScrape(taskId: number): Promise<MapsScraperTask> {
    const task = await this.findTask(taskId);
    if (task.status === 'running') {
      throw new NotFoundException('Task is already running');
    }

    // Clear old results
    await this.db.delete(schema.mapsScraperResult).where(eq(schema.mapsScraperResult.taskId, taskId));

    const stopFlag = { stop: false };
    this.runningTasks.set(taskId, stopFlag);

    // Update to running
    await this.updateTask(taskId, {
      status: 'running',
      totalAreas: 1,
      completedAreas: 0,
      failedAreas: 0,
      totalResults: 0,
      startedAt: new Date(),
      completedAt: undefined as any,
      logs: ['🚀 启动 Playwright 浏览器...'],
    });

    // Run async
    this.runScrape(taskId, task, stopFlag).catch((err) => {
      this.logger.error(`Scrape task ${taskId} failed: ${err.message}`);
      this.updateTask(taskId, {
        status: 'failed',
        logs: [...(this.getCurrentLogs(taskId)), `❌ 采集失败: ${err.message}`],
      }).catch(() => {});
    });

    return this.findTask(taskId);
  }

  async stopScrape(taskId: number): Promise<MapsScraperTask> {
    const flag = this.runningTasks.get(taskId);
    if (flag) flag.stop = true;
    return this.updateTask(taskId, {
      status: 'stopped',
      completedAt: new Date(),
      logs: [...(this.getCurrentLogs(taskId)), '⏹️ 用户停止采集'],
    });
  }

  private getCurrentLogs(taskId: number): string[] {
    try {
      // We can't easily get current logs from DB in sync, return empty and let update append
      return [];
    } catch {
      return [];
    }
  }

  private async runScrape(taskId: number, task: MapsScraperTask, stopFlag: { stop: boolean }) {
    const logs: string[] = ['🚀 启动 Playwright 浏览器...'];
    const appendLog = (msg: string) => {
      logs.push(msg);
      this.updateTask(taskId, { logs: [...logs] }).catch(() => {});
    };

    const scraper = new GoogleMapsScraper();

    try {
      appendLog('🌐 初始化 Chromium 浏览器（无头模式）...');
      await scraper.init(true);
      appendLog('✅ 浏览器初始化成功');
      const results = await scraper.scrape({
        keyword: task.keyword,
        country: task.country,
        state: task.state,
        city: task.city,
        perArea: task.perArea,
        extractEmail: task.extractEmail,
        onLog: (msg) => appendLog(msg),
        onProgress: (completed, total) => {
          this.updateTask(taskId, {
            completedAreas: completed,
            totalAreas: total,
            totalResults: completed,
          }).catch(() => {});
        },
        shouldStop: () => stopFlag.stop,
      });

      // Save results
      if (results.length > 0) {
        const dbResults = results.map((r) => ({
          taskId,
          keyword: r.keyword || task.keyword,
          industry: r.industry || task.keyword,
          name: r.name,
          address: r.address,
          city: r.city,
          state: task.state,
          zipCode: r.zipCode,
          phone: r.phone,
          whatsapp: r.whatsapp,
          email: r.email,
          website: r.website,
          rating: r.rating,
          reviewsCount: r.reviewsCount,
        }));
        await this.db.insert(schema.mapsScraperResult).values(dbResults as any);
        appendLog(`💾 已保存 ${results.length} 条数据到数据库`);
      }

      const finalStatus = stopFlag.stop ? 'stopped' : 'completed';
      await this.updateTask(taskId, {
        status: finalStatus,
        completedAreas: results.length,
        totalResults: results.length,
        completedAt: new Date(),
        logs: [...logs, finalStatus === 'stopped' ? '⏹️ 采集已停止' : '🎉 采集完成'],
      });
    } catch (err) {
      const errMsg = (err as Error).message;
      let friendlyMsg = errMsg;
      if (errMsg.includes('Executable doesn\'t exist') || errMsg.includes('playwright install')) {
        friendlyMsg = 'Playwright 浏览器未安装。请在项目根目录运行: npx playwright install chromium';
      }
      appendLog(`❌ 采集出错: ${friendlyMsg}`);
      await this.updateTask(taskId, {
        status: 'failed',
        completedAt: new Date(),
        logs: [...logs, `❌ 采集失败: ${friendlyMsg}`],
      }).catch(() => {});
    } finally {
      await scraper.close();
      this.runningTasks.delete(taskId);
    }
  }

  // Results
  async findResults(taskId: number, search?: string): Promise<MapsScraperResult[]> {
    let query = this.db.select().from(schema.mapsScraperResult).where(eq(schema.mapsScraperResult.taskId, taskId));
    if (search) {
      const s = `%${search}%`;
      query = this.db.select().from(schema.mapsScraperResult).where(
        and(
          eq(schema.mapsScraperResult.taskId, taskId),
          or(
            like(schema.mapsScraperResult.name, s),
            like(schema.mapsScraperResult.city, s),
            like(schema.mapsScraperResult.email, s),
          ),
        ),
      ) as any;
    }
    const rows = await query.orderBy(desc(schema.mapsScraperResult.createdAt));
    return rows.map((r) => this.toResult(r));
  }

  async markAddedToCustomer(resultId: number): Promise<MapsScraperResult> {
    const [result] = await this.db.select().from(schema.mapsScraperResult).where(eq(schema.mapsScraperResult.id, resultId));
    if (!result) throw new NotFoundException('Result not found');
    if (result.addedToCustomer) return this.toResult(result);

    // Generate customer number
    const customerNo = `C${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

    // Create customer record
    await this.db.insert(schema.customer).values({
      customerNo,
      company: result.name,
      country: result.state || '',
      city: result.city || '',
      source: 'maps_scraper',
      whatsapp: result.whatsapp || result.phone || '',
      website: result.website || '',
      email: result.email || '',
      customerType: result.industry || '',
      priority: 'B',
      businessDetail: `Imported from Maps Scraper. Keyword: ${result.keyword || ''}. Address: ${result.address || ''}. Zip: ${result.zipCode || ''}. Rating: ${result.rating || 'N/A'}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Mark result as added
    const [row] = await this.db.update(schema.mapsScraperResult).set({ addedToCustomer: true }).where(eq(schema.mapsScraperResult.id, resultId)).returning();
    return this.toResult(row);
  }

  async deleteResult(id: number): Promise<{ success: boolean }> {
    await this.db.delete(schema.mapsScraperResult).where(eq(schema.mapsScraperResult.id, id));
    return { success: true };
  }

  // Presets
  async findPresets(): Promise<MapsScraperPreset[]> {
    const rows = await this.db.select().from(schema.mapsScraperPreset).orderBy(desc(schema.mapsScraperPreset.createdAt));
    return rows.map((r) => this.toPreset(r));
  }

  async createPreset(data: Partial<MapsScraperPreset>): Promise<MapsScraperPreset> {
    const [row] = await this.db.insert(schema.mapsScraperPreset).values({
      name: data.name!,
      country: data.country!,
      state: data.state,
      city: data.city,
      keyword: data.keyword!,
      perArea: data.perArea ?? 10,
      extractEmail: data.extractEmail ?? true,
    }).returning();
    return this.toPreset(row);
  }

  async deletePreset(id: number): Promise<{ success: boolean }> {
    await this.db.delete(schema.mapsScraperPreset).where(eq(schema.mapsScraperPreset.id, id));
    return { success: true };
  }

  private toTask(row: any): MapsScraperTask {
    return {
      id: row.id,
      name: row.name,
      country: row.country,
      state: row.state,
      city: row.city,
      keyword: row.keyword,
      perArea: row.perArea,
      extractEmail: row.extractEmail,
      status: row.status,
      totalAreas: row.totalAreas,
      completedAreas: row.completedAreas,
      failedAreas: row.failedAreas,
      totalResults: row.totalResults,
      logs: typeof row.logs === 'string' ? JSON.parse(row.logs || '[]') : row.logs,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
    };
  }

  private toResult(row: any): MapsScraperResult {
    return {
      id: row.id,
      taskId: row.taskId,
      keyword: row.keyword,
      industry: row.industry,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zipCode,
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email,
      website: row.website,
      rating: row.rating,
      reviewsCount: row.reviewsCount,
      latitude: row.latitude,
      longitude: row.longitude,
      addedToCustomer: row.addedToCustomer,
      createdAt: row.createdAt,
    };
  }

  private toPreset(row: any): MapsScraperPreset {
    return {
      id: row.id,
      name: row.name,
      country: row.country,
      state: row.state,
      city: row.city,
      keyword: row.keyword,
      perArea: row.perArea,
      extractEmail: row.extractEmail,
      createdAt: row.createdAt,
    };
  }
}
