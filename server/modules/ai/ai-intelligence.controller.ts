import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Inject } from '@nestjs/common';
import type { DbType } from '../../database/db';
import { DATABASE_PROVIDER } from '../database/database.module';
import { aiIntelligenceReport } from '../../database/sqlite-schema';
import { eq, desc } from 'drizzle-orm';
import { AiService } from './ai.service';

@Controller('api/ai-intelligence')
export class AiIntelligenceController {
  constructor(
    @Inject(DATABASE_PROVIDER) private db: DbType,
    private aiService: AiService,
  ) {}

  // 创建背调任务
  @Post('analyze')
  @UseGuards(AuthGuard('jwt'))
  async analyze(@Body() body: { companyName: string; website?: string }) {
    const [report] = await this.db.insert(aiIntelligenceReport).values({
      companyName: body.companyName,
      website: body.website,
      status: 'analyzing',
    } as any).returning();

    // 模拟分析，立即生成报告
    const intelligence = this.aiService.generateIntelligenceReport(body.companyName, body.website);

    await this.db.update(aiIntelligenceReport)
      .set({
        status: 'completed',
        basicInfo: JSON.stringify(intelligence.basicInfo as any),
        businessInfo: JSON.stringify(intelligence.businessInfo as any),
        mainProducts: JSON.stringify(intelligence.mainProducts as any),
        brandInfo: JSON.stringify(intelligence.brandInfo as any),
        marketCoverage: JSON.stringify(intelligence.marketCoverage as any),
        socialMedia: JSON.stringify(intelligence.socialMedia as any),
        companyPotential: JSON.stringify(intelligence.companyPotential as any),
        riskAnalysis: JSON.stringify(intelligence.riskAnalysis as any),
        purchaseProbability: intelligence.purchaseProbability,
        recommendation: JSON.stringify(intelligence.recommendation as any),
        contacts: JSON.stringify(intelligence.contacts as any),
        completedAt: new Date(),
      } as any)
      .where(eq(aiIntelligenceReport.id, report.id));

    return { ...report, status: 'completed', ...intelligence };
  }

  // 获取报告列表
  @Get('reports')
  @UseGuards(AuthGuard('jwt'))
  async getReports() {
    const items = await this.db.select().from(aiIntelligenceReport)
      .orderBy(desc(aiIntelligenceReport.createdAt));
    return { items };
  }

  // 获取单个报告
  @Get('report/:id')
  @UseGuards(AuthGuard('jwt'))
  async getReport(@Param('id') id: string) {
    const [report] = await this.db.select().from(aiIntelligenceReport)
      .where(eq(aiIntelligenceReport.id, Number(id))).limit(1);

    if (!report) return null;

    return {
      ...report,
      basicInfo: report.basicInfo,
      businessInfo: report.businessInfo,
      mainProducts: report.mainProducts || [],
      brandInfo: report.brandInfo,
      marketCoverage: report.marketCoverage,
      socialMedia: report.socialMedia,
      companyPotential: report.companyPotential,
      riskAnalysis: report.riskAnalysis,
      recommendation: report.recommendation,
      contacts: report.contacts || [],
    };
  }
}
