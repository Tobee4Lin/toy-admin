import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Inject } from '@nestjs/common';
import type { DbType } from '../../database/db';
import { DATABASE_PROVIDER } from '../database/database.module';
import { emailAccount, emailMessage } from '../../database/sqlite-schema';
import { eq, desc, and } from 'drizzle-orm';
import { AiService } from './ai.service';

@Controller('api/email-center')
export class EmailCenterController {
  constructor(
    @Inject(DATABASE_PROVIDER) private db: DbType,
    private aiService: AiService,
  ) {}

  // 邮箱账户管理
  @Get('accounts')
  @UseGuards(AuthGuard('jwt'))
  async getAccounts() {
    const items = await this.db.select().from(emailAccount).orderBy(desc(emailAccount.createdAt));
    // 不返回密码和token
    return { items: items.map(({ password, accessToken, refreshToken, ...rest }) => rest) };
  }

  @Post('accounts')
  @UseGuards(AuthGuard('jwt'))
  async addAccount(@Body() body: {
    name: string;
    email: string;
    provider: 'gmail' | 'outlook' | 'smtp';
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    imapHost?: string;
    imapPort?: number;
    username?: string;
    password?: string;
  }) {
    const [account] = await this.db.insert(emailAccount).values({
      name: body.name,
      email: body.email,
      provider: body.provider,
      smtpHost: body.smtpHost,
      smtpPort: body.smtpPort,
      smtpSecure: body.smtpSecure || false,
      imapHost: body.imapHost,
      imapPort: body.imapPort,
      username: body.username,
      password: body.password,
    }).returning();
    const { password, accessToken, refreshToken, ...rest } = account;
    return rest;
  }

  @Put('accounts/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateAccount(@Param('id') id: string, @Body() body: Partial<any>) {
    await this.db.update(emailAccount).set(body).where(eq(emailAccount.id, Number(id)));
    return { success: true };
  }

  @Delete('accounts/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteAccount(@Param('id') id: string) {
    await this.db.delete(emailAccount).where(eq(emailAccount.id, Number(id)));
    return { success: true };
  }

  // 同步邮件（模拟）
  @Post('accounts/:id/sync')
  @UseGuards(AuthGuard('jwt'))
  async syncEmails(@Param('id') id: string) {
    // 模拟同步，生成一些示例邮件
    const sampleEmails = [
      { direction: 'inbound' as const, subject: 'Re: Bubble Toys Quotation', fromName: 'Ahmed Al-Rashid', fromEmail: 'ahmed@happykids.com', toEmail: ['sales@yourcompany.com'], bodyText: 'Hi, thank you for the quotation. Could you please send me the sample PI? We would like to proceed with a sample order first.', aiCategory: 'sample_request', aiSummary: 'Customer requests sample PI after receiving quotation.' },
      { direction: 'inbound' as const, subject: 'Price Inquiry - RC Cars', fromName: 'Maria Garcia', fromEmail: 'maria@sunrisetoys.com', toEmail: ['sales@yourcompany.com'], bodyText: 'Hello, we are interested in your RC car collection. Please send us your best FOB price for 1000 pcs per model. Also need catalog and MOQ details.', aiCategory: 'price_request', aiSummary: 'Customer requests FOB pricing for RC cars, 1000 pcs MOQ.' },
      { direction: 'inbound' as const, subject: 'Not interested at this time', fromName: 'John Smith', fromEmail: 'john@toyworld.com', toEmail: ['sales@yourcompany.com'], bodyText: 'Thank you for your email. We are not interested in new suppliers at this moment as we have existing contracts. Will contact you if needs change.', aiCategory: 'not_interested', aiSummary: 'Customer declines due to existing supplier contracts.' },
      { direction: 'outbound' as const, subject: 'Bubble Toys Supplier from Chenghai - HappyKids Trading', fromName: 'Your Name', fromEmail: 'sales@yourcompany.com', toEmail: ['ahmed@happykids.com'], bodyText: 'Hi Ahmed, I noticed that HappyKids distributes imported toy brands in Saudi Arabia...', aiCategory: 'uncategorized', aiSummary: 'Initial outreach email sent.' },
    ];

    for (const email of sampleEmails) {
      const aiResult = this.aiService.classifyEmail({ subject: email.subject, body: email.bodyText, fromEmail: email.fromEmail });
      const draftReply = this.aiService.generateDraftReply({ category: aiResult.category, subject: email.subject, fromName: email.fromName });

      await this.db.insert(emailMessage).values({
        accountId: Number(id),
        messageId: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        threadId: 'thread_' + Math.random().toString(36).slice(2, 10),
        direction: email.direction,
        subject: email.subject,
        fromName: email.fromName,
        fromEmail: email.fromEmail,
        toEmail: email.toEmail,
        bodyText: email.bodyText,
        aiCategory: aiResult.category as any,
        aiSummary: aiResult.summary,
        aiDraftReply: draftReply,
        sentAt: email.direction === 'outbound' ? new Date() : null,
        receivedAt: email.direction === 'inbound' ? new Date() : null,
      } as any);
    }

    await this.db.update(emailAccount).set({ lastSyncAt: new Date() }).where(eq(emailAccount.id, Number(id)));
    return { success: true, syncedCount: sampleEmails.length };
  }

  // 邮件列表
  @Get('messages')
  @UseGuards(AuthGuard('jwt'))
  async getMessages(
    @Query('accountId') accountId?: string,
    @Query('direction') direction?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 20;

    let conditions: any[] = [];
    if (accountId) conditions.push(eq(emailMessage.accountId, Number(accountId)));
    if (direction) conditions.push(eq(emailMessage.direction, direction as any));
    if (category) conditions.push(eq(emailMessage.aiCategory, category as any));

    const items = await this.db.select().from(emailMessage)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(emailMessage.createdAt))
      .limit(ps).offset((p - 1) * ps);

    const parsed = items.map(item => ({
      ...item,
      toEmail: item.toEmail || [],
      ccEmail: item.ccEmail || [],
    }));

    return { items: parsed, page: p, pageSize: ps };
  }

  // 获取单封邮件
  @Get('messages/:id')
  @UseGuards(AuthGuard('jwt'))
  async getMessage(@Param('id') id: string) {
    const [msg] = await this.db.select().from(emailMessage).where(eq(emailMessage.id, Number(id))).limit(1);
    if (!msg) return null;
    return {
      ...msg,
      toEmail: msg.toEmail || [],
      ccEmail: msg.ccEmail || [],
    };
  }

  // 标记已读
  @Put('messages/:id/read')
  @UseGuards(AuthGuard('jwt'))
  async markRead(@Param('id') id: string) {
    await this.db.update(emailMessage).set({ isRead: true }).where(eq(emailMessage.id, Number(id)));
    return { success: true };
  }

  // 发送邮件（模拟）
  @Post('messages/send')
  @UseGuards(AuthGuard('jwt'))
  async sendEmail(@Body() body: {
    accountId: number;
    toEmail: string;
    subject: string;
    body: string;
    threadId?: string;
  }) {
    const [msg] = await this.db.insert(emailMessage).values({
      accountId: body.accountId,
      messageId: 'msg_' + Date.now(),
      threadId: body.threadId || 'thread_' + Date.now(),
      direction: 'outbound',
      subject: body.subject,
      fromName: 'Your Name',
      fromEmail: 'sales@yourcompany.com',
      toEmail: [body.toEmail],
      bodyText: body.body,
      isRead: true,
      aiCategory: 'uncategorized',
      sentAt: new Date(),
    } as any).returning();
    return { success: true, message: msg };
  }

  // 重新生成AI分类和回复建议
  @Post('messages/:id/reanalyze')
  @UseGuards(AuthGuard('jwt'))
  async reanalyze(@Param('id') id: string) {
    const [msg] = await this.db.select().from(emailMessage).where(eq(emailMessage.id, Number(id))).limit(1);
    if (!msg) throw new Error('Message not found');

    const aiResult = this.aiService.classifyEmail({ subject: msg.subject || '', body: msg.bodyText || '', fromEmail: msg.fromEmail });
    const draftReply = this.aiService.generateDraftReply({ category: aiResult.category, subject: msg.subject || '', fromName: msg.fromName });

    await this.db.update(emailMessage)
      .set({ aiCategory: aiResult.category as any, aiSummary: aiResult.summary, aiDraftReply: draftReply } as any)
      .where(eq(emailMessage.id, Number(id)));

    return { category: aiResult.category, summary: aiResult.summary, draftReply };
  }

  // 删除邮件
  @Delete('messages/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteMessage(@Param('id') id: string) {
    await this.db.delete(emailMessage).where(eq(emailMessage.id, Number(id)));
    return { success: true };
  }
}
