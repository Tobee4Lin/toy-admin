import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Inject } from '@nestjs/common';
import type { DbType } from '../../database/db';
import { DATABASE_PROVIDER } from '../database/database.module';
import { aiOutreach, customer } from '../../database/sqlite-schema';
import { eq, desc } from 'drizzle-orm';
import { AiService } from './ai.service';

@Controller('api/ai-outreach')
export class AiOutreachController {
  constructor(
    @Inject(DATABASE_PROVIDER) private db: DbType,
    private aiService: AiService,
  ) {}

  // 生成开发策略和开发信
  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  async generate(@Body() body: {
    customerId?: number;
    customerName: string;
    productName: string;
    targetCountry: string;
    customerInfo?: any;
  }) {
    const result = this.aiService.generateOutreach({
      customerName: body.customerName,
      customerInfo: body.customerInfo,
      productName: body.productName,
      targetCountry: body.targetCountry,
    });

    const [record] = await this.db.insert(aiOutreach).values({
      customerId: body.customerId,
      customerName: body.customerName,
      productName: body.productName,
      targetCountry: body.targetCountry,
      strategy: JSON.stringify(result.strategy as any),
      coldEmail: JSON.stringify(result.coldEmail as any),
      linkedinMessage: result.linkedinMessage,
      facebookMessage: result.facebookMessage,
      whatsappMessage: result.whatsappMessage,
    }).returning();

    return { ...record, ...result };
  }

  // 获取开发信列表
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    let conditions: any[] = [];
    if (customerId) conditions.push(eq(aiOutreach.customerId, Number(customerId)));
    if (status) conditions.push(eq(aiOutreach.status, status as any));

    const items = await this.db.select().from(aiOutreach)
      .where(conditions.length ? conditions[0] : undefined)
      .orderBy(desc(aiOutreach.createdAt));

    return { items };
  }

  // 获取单个开发信
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    const [record] = await this.db.select().from(aiOutreach)
      .where(eq(aiOutreach.id, Number(id))).limit(1);

    if (!record) return null;

    return {
      ...record,
      strategy: record.strategy,
      coldEmail: record.coldEmail,
    };
  }

  // 标记为已发送
  @Put(':id/send')
  @UseGuards(AuthGuard('jwt'))
  async markSent(@Param('id') id: string) {
    await this.db.update(aiOutreach)
      .set({ status: 'sent', sentAt: new Date() } as any)
      .where(eq(aiOutreach.id, Number(id)));
    return { success: true };
  }

  // 删除开发信
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string) {
    await this.db.delete(aiOutreach).where(eq(aiOutreach.id, Number(id)));
    return { success: true };
  }
}
