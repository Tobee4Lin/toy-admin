import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, like, or, desc, count, sql } from 'drizzle-orm';
import { Logger } from '@nestjs/common';
import { DATABASE_PROVIDER } from '../database/database.module';
import { inquiry } from '../../database/sqlite-schema';
import type { DbType } from '../../database/db';
import type {
  Inquiry,
  InquiryListResponse,
  PublicInquirySubmitRequest,
  PublicLeadSubmitRequest,
  PublicSubmitResponse,
} from '@shared/api.interface';

type InquiryStatus = 'new' | 'read' | 'replied' | 'archived';

@Injectable()
export class InquiryService {
  private readonly logger = new Logger(InquiryService.name);

  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
  ) {}

  async findAll(params: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<InquiryListResponse> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (params.status) {
      conditions.push(eq(inquiry.status, params.status));
    }
    if (params.search) {
      const searchTerm = `%${params.search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${inquiry.name})`, searchTerm),
          like(sql`lower(${inquiry.company})`, searchTerm),
          like(sql`lower(${inquiry.email})`, searchTerm),
          like(sql`lower(${inquiry.productName})`, searchTerm),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const searchConditions = params.search
      ? [
          or(
            like(sql`lower(${inquiry.name})`, `%${params.search.toLowerCase()}%`),
            like(sql`lower(${inquiry.company})`, `%${params.search.toLowerCase()}%`),
            like(sql`lower(${inquiry.email})`, `%${params.search.toLowerCase()}%`),
            like(sql`lower(${inquiry.productName})`, `%${params.search.toLowerCase()}%`),
          ),
        ]
      : undefined;
    const newWhereClause = searchConditions
      ? and(eq(inquiry.status, 'new'), ...searchConditions)
      : eq(inquiry.status, 'new');

    const [countResult, newCountResult, items] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(inquiry)
        .where(whereClause),
      this.db
        .select({ count: count() })
        .from(inquiry)
        .where(newWhereClause),
      this.db
        .select()
        .from(inquiry)
        .where(whereClause)
        .orderBy(desc(inquiry.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = countResult[0]?.count ?? 0;
    const newInquiries = newCountResult[0]?.count ?? 0;

    return {
      items: items.map((item) => this.mapToDto(item)),
      total,
      page,
      pageSize,
      newInquiries,
    };
  }

  async findOne(id: number): Promise<Inquiry> {
    const rows = await this.db
      .select()
      .from(inquiry)
      .where(eq(inquiry.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('询盘不存在');
    }

    return this.mapToDto(rows[0]);
  }

  async updateStatus(id: number, status: InquiryStatus): Promise<{ id: number; status: string }> {
    const updated = await this.db
      .update(inquiry)
      .set({ status, updatedAt: sql`(unixepoch() * 1000)` })
      .where(eq(inquiry.id, id))
      .returning({ id: inquiry.id, status: inquiry.status });

    if (updated.length === 0) {
      throw new NotFoundException('询盘不存在');
    }

    return { id: updated[0].id, status: updated[0].status };
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const deleted = await this.db
      .delete(inquiry)
      .where(eq(inquiry.id, id))
      .returning({ id: inquiry.id });

    if (deleted.length === 0) {
      throw new NotFoundException('询盘不存在');
    }

    return { success: true };
  }

  async submitPublicInquiry(
    dto: PublicInquirySubmitRequest,
  ): Promise<PublicSubmitResponse> {
    const rows = await this.db
      .insert(inquiry)
      .values({
        name: dto.name,
        company: dto.company,
        country: dto.country,
        email: dto.email,
        whatsapp: dto.whatsapp ?? null,
        estimatedQuantity: dto.estimatedQuantity ?? null,
        productName: dto.productName ?? null,
        productItemNumber: dto.itemNumber ?? null,
        productCategory: dto.category ?? null,
        pageUrl: dto.pageUrl ?? null,
        message: dto.message ?? null,
        customizationRequirement: dto.customizationRequirement ?? null,
        selectedProducts: dto.selectedProducts ?? [],
        source: dto.source ?? 'rfq',
        status: 'new',
      })
      .returning({ id: inquiry.id });

    return {
      success: true,
      message: 'Inquiry submitted successfully',
      inquiryId: String(rows[0]?.id),
    };
  }

  async submitPublicLead(
    dto: PublicLeadSubmitRequest,
  ): Promise<PublicSubmitResponse> {
    const rows = await this.db
      .insert(inquiry)
      .values({
        name: dto.name,
        company: dto.company,
        country: dto.country,
        email: dto.email,
        whatsapp: dto.whatsapp ?? null,
        productInterest: dto.productInterest ?? null,
        sourcePage: dto.sourcePage ?? null,
        productCategory: dto.category ?? null,
        source: 'catalog',
        status: 'new',
      })
      .returning({ id: inquiry.id });

    const downloadUrl = '/catalogs/toys-catalog-2026.pdf';

    return {
      success: true,
      message: 'Catalog request submitted successfully',
      inquiryId: String(rows[0]?.id),
      downloadUrl,
    };
  }

  private mapToDto(row: typeof inquiry.$inferSelect): Inquiry {
    return {
      id: String(row.id),
      name: row.name ?? '',
      company: row.company ?? '',
      country: row.country ?? '',
      email: row.email ?? '',
      whatsapp: row.whatsapp ?? '',
      estimatedQuantity: row.estimatedQuantity ?? '',
      productName: row.productName ?? '',
      productItemNumber: row.productItemNumber ?? '',
      productCategory: row.productCategory ?? '',
      pageUrl: row.pageUrl ?? '',
      message: row.message ?? '',
      customizationRequirement: row.customizationRequirement ?? '',
      selectedProducts: (row.selectedProducts as import('@shared/api.interface').SelectedProduct[]) ?? [],
      productInterest: row.productInterest ?? '',
      sourcePage: row.sourcePage ?? '',
      source: row.source ?? 'rfq',
      status: (row.status as InquiryStatus) ?? 'new',
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }
}
