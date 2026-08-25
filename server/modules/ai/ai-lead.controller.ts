import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Inject } from '@nestjs/common';
import type { DbType } from '../../database/db';
import { DATABASE_PROVIDER } from '../database/database.module';
import { aiLeadSearch, aiLead, customer } from '../../database/sqlite-schema';
import { eq, desc, like, and, inArray, gte } from 'drizzle-orm';
import { AiService } from './ai.service';

@Controller('api/ai-leads')
export class AiLeadController {
  constructor(
    @Inject(DATABASE_PROVIDER) private db: DbType,
    private aiService: AiService,
  ) {}

  // 创建获客搜索任务
  @Post('search')
  @UseGuards(AuthGuard('jwt'))
  async createSearch(@Body() body: {
    productName: string;
    keywords: string[];
    hsCode?: string;
    industry?: string;
    targetCountries: string[];
    targetCustomerTypes: string[];
  }) {
    const strategy = this.aiService.generateSearchStrategy(body);

    const [search] = await this.db.insert(aiLeadSearch).values({
      productName: body.productName,
      keywords: JSON.stringify(body.keywords || [] as any),
      hsCode: body.hsCode,
      industry: body.industry,
      targetCountries: JSON.stringify(body.targetCountries || [] as any),
      targetCustomerTypes: JSON.stringify(body.targetCustomerTypes || [] as any),
      status: 'searching',
      searchStrategy: JSON.stringify(strategy as any),
    } as any).returning();

    // 模拟异步搜索，立即生成结果
    const leads = this.aiService.generateLeads({
      productName: body.productName,
      targetCountries: body.targetCountries,
      targetCustomerTypes: body.targetCustomerTypes,
      count: 15,
    });

    for (const lead of leads) {
      await this.db.insert(aiLead).values({
        searchId: search.id,
        companyName: lead.companyName,
        website: lead.website,
        country: lead.country,
        city: lead.city,
        industry: lead.industry,
        businessType: lead.businessType,
        companySize: lead.companySize,
        estimatedScale: lead.estimatedScale,
        productRelevance: lead.productRelevance,
        potentialCustomerType: lead.potentialCustomerType,
        email: lead.email,
        phone: lead.phone,
        whatsapp: lead.whatsapp,
        linkedin: lead.linkedin,
        facebook: lead.facebook,
        instagram: lead.instagram,
        contactPerson: lead.contactPerson,
        jobTitle: lead.jobTitle,
        leadScore: lead.leadScore,
        leadGrade: lead.leadGrade as any,
        scoreDetails: JSON.stringify(lead.scoreDetails as any),
        source: lead.source,
      } as any);
    }

    await this.db.update(aiLeadSearch)
      .set({ status: 'completed', resultCount: leads.length, completedAt: new Date() } as any)
      .where(eq(aiLeadSearch.id, search.id));

    return { ...search, status: 'completed', resultCount: leads.length, leads };
  }

  // 获取搜索任务列表
  @Get('searches')
  @UseGuards(AuthGuard('jwt'))
  async getSearches(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 20;
    const items = await this.db.select().from(aiLeadSearch)
      .orderBy(desc(aiLeadSearch.createdAt))
      .limit(ps).offset((p - 1) * ps);
    return { items, page: p, pageSize: ps };
  }

  // 获取搜索结果
  @Get('search/:id/leads')
  @UseGuards(AuthGuard('jwt'))
  async getSearchLeads(
    @Param('id') id: string,
    @Query('grade') grade?: string,
    @Query('minScore') minScore?: string,
    @Query('country') country?: string,
  ) {
    let conditions: any[] = [eq(aiLead.searchId, Number(id))];
    if (grade) conditions.push(eq(aiLead.leadGrade, grade as any));
    if (minScore) conditions.push(gte(aiLead.leadScore, Number(minScore)));
    if (country) conditions.push(eq(aiLead.country, country));

    const items = await this.db.select().from(aiLead)
      .where(and(...conditions))
      .orderBy(desc(aiLead.leadScore));
    return { items };
  }

  // 获取单个获客结果详情
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getLead(@Param('id') id: string) {
    const [lead] = await this.db.select().from(aiLead).where(eq(aiLead.id, Number(id))).limit(1);
    return lead;
  }

  // 保存到客户管理
  @Post(':id/save-to-customer')
  @UseGuards(AuthGuard('jwt'))
  async saveToCustomer(@Param('id') id: string) {
    const [lead] = await this.db.select().from(aiLead).where(eq(aiLead.id, Number(id))).limit(1);
    if (!lead) throw new Error('Lead not found');

    const customerNo = 'CUS' + Date.now().toString().slice(-8);
    const [newCustomer] = await this.db.insert(customer).values({
      customerNo,
      company: lead.companyName,
      country: lead.country,
      city: lead.city,
      website: lead.website,
      email: lead.email,
      whatsapp: lead.whatsapp,
      linkedin: lead.linkedin,
      facebook: lead.facebook,
      instagram: lead.instagram,
      contactPerson: lead.contactPerson,
      customerType: lead.potentialCustomerType,
      priority: lead.leadGrade,
      source: 'AI Lead Generation',
      background: `AI Generated Lead. Score: ${lead.leadScore}. Business Type: ${lead.businessType}`,
    }).returning();

    await this.db.update(aiLead)
      .set({ isSaved: true, savedCustomerId: newCustomer.id })
      .where(eq(aiLead.id, Number(id)));

    return { success: true, customer: newCustomer };
  }

  // 删除获客结果
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteLead(@Param('id') id: string) {
    await this.db.delete(aiLead).where(eq(aiLead.id, Number(id)));
    return { success: true };
  }

  // 删除搜索任务（级联删除结果）
  @Delete('search/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteSearch(@Param('id') id: string) {
    await this.db.delete(aiLead).where(eq(aiLead.searchId, Number(id)));
    await this.db.delete(aiLeadSearch).where(eq(aiLeadSearch.id, Number(id)));
    return { success: true };
  }
}
