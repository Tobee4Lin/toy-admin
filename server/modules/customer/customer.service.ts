import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import * as schema from '../../database/sqlite-schema';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { DbType } from '../../database/db';

export interface Customer {
  id: string;
  customerNo: string;
  company: string;
  country?: string;
  city?: string;
  background?: string;
  scale?: string;
  employeeCount?: string;
  foundedYear?: string;
  source?: string;
  contactPerson?: string;
  whatsapp?: string;
  googleAddress?: string;
  facebook?: string;
  website?: string;
  email?: string;
  instagram?: string;
  linkedin?: string;
  contactInvalid?: Record<string, boolean>;
  customerType?: string;
  priority?: string;
  brandUsed?: string;
  businessDetail?: string;
  lastFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFollowup {
  id: string;
  customerId: string;
  followDate: string;
  content?: string;
  feedback?: string;
  isReplied: boolean;
  createdAt: string;
}

export interface CustomerStats {
  total: number;
  notContacted: number;
  contactedIn7Days: number;
  notFollowedIn30Days: number;
}

function parseJsonField(value: unknown, fallback: any): any {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function toCustomer(row: typeof schema.customer.$inferSelect): Customer {
  return {
    id: String(row.id),
    customerNo: row.customerNo,
    company: row.company,
    country: row.country ?? '',
    city: row.city ?? '',
    background: row.background ?? '',
    scale: row.scale ?? '',
    employeeCount: row.employeeCount ?? '',
    foundedYear: row.foundedYear ?? '',
    source: row.source ?? 'manual',
    contactPerson: row.contactPerson ?? '',
    whatsapp: row.whatsapp ?? '',
    googleAddress: row.googleAddress ?? '',
    facebook: row.facebook ?? '',
    website: row.website ?? '',
    email: row.email ?? '',
    instagram: row.instagram ?? '',
    linkedin: row.linkedin ?? '',
    contactInvalid: parseJsonField(row.contactInvalid, {}),
    customerType: row.customerType ?? '',
    priority: row.priority ?? 'C',
    brandUsed: row.brandUsed ?? '',
    businessDetail: row.businessDetail ?? '',
    lastFollowUpAt: row.lastFollowUpAt ? new Date(row.lastFollowUpAt).toISOString() : '',
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function toFollowup(row: typeof schema.customerFollowup.$inferSelect): CustomerFollowup {
  return {
    id: String(row.id),
    customerId: String(row.customerId),
    followDate: new Date(row.followDate).toISOString(),
    content: row.content ?? '',
    feedback: row.feedback ?? '',
    isReplied: row.isReplied,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function generateCustomerNo(db: DbType): string {
  const year = new Date().getFullYear();
  const prefix = `C${year}`;
  const last = db
    .select({ customerNo: schema.customer.customerNo })
    .from(schema.customer)
    .where(sql`${schema.customer.customerNo} LIKE ${prefix + '%'}`)
    .orderBy(desc(schema.customer.customerNo))
    .limit(1)
    .get();
  let seq = 1;
  if (last?.customerNo) {
    const num = parseInt(last.customerNo.substring(prefix.length), 10);
    if (!isNaN(num)) seq = num + 1;
  }
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

@Injectable()
export class CustomerService {
  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
  ) {}

  async findAll(params: {
    search?: string;
    contactStatus?: string;
    priority?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Customer[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (params.search) {
      const pattern = `%${params.search.toLowerCase()}%`;
      conditions.push(
        sql`(
          lower(${schema.customer.company}) LIKE ${pattern}
          OR lower(${schema.customer.contactPerson}) LIKE ${pattern}
          OR lower(${schema.customer.whatsapp}) LIKE ${pattern}
          OR lower(${schema.customer.email}) LIKE ${pattern}
          OR lower(${schema.customer.country}) LIKE ${pattern}
        )`,
      );
    }
    if (params.priority && params.priority !== 'all') {
      conditions.push(eq(schema.customer.priority, params.priority));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let rows = this.db
      .select()
      .from(schema.customer)
      .where(where)
      .orderBy(desc(schema.customer.createdAt))
      .limit(pageSize)
      .offset(offset)
      .all();

    // Filter by contact status in memory (simpler)
    if (params.contactStatus && params.contactStatus !== 'all') {
      const now = Date.now();
      rows = rows.filter((row) => {
        const lastFollow = row.lastFollowUpAt ? row.lastFollowUpAt.getTime() : null;
        if (params.contactStatus === 'not_contacted') return !lastFollow;
        if (params.contactStatus === 'contacted_7d') {
          return !!lastFollow && now - lastFollow <= 7 * 86400000;
        }
        if (params.contactStatus === 'not_followed_30d') {
          return !lastFollow || now - lastFollow > 30 * 86400000;
        }
        return true;
      });
    }

    const countResult = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.customer)
      .where(where)
      .get();

    return {
      items: rows.map((row) => toCustomer(row)),
      total: countResult?.count ?? 0,
      page,
      pageSize,
    };
  }

  async findOne(id: number): Promise<Customer & { followups: CustomerFollowup[] }> {
    const row = this.db
      .select()
      .from(schema.customer)
      .where(eq(schema.customer.id, id))
      .get();
    if (!row) throw new NotFoundException('客户不存在');

    const followups = this.db
      .select()
      .from(schema.customerFollowup)
      .where(eq(schema.customerFollowup.customerId, id))
      .orderBy(desc(schema.customerFollowup.followDate))
      .all();

    return {
      ...toCustomer(row),
      followups: followups.map((f) => toFollowup(f)),
    };
  }

  async getStats(): Promise<CustomerStats> {
    const now = Date.now();
    const all = this.db.select().from(schema.customer).all();
    const total = all.length;
    const notContacted = all.filter((c) => !c.lastFollowUpAt).length;
    const contactedIn7Days = all.filter(
      (c) => c.lastFollowUpAt && now - c.lastFollowUpAt.getTime() <= 7 * 86400000,
    ).length;
    const notFollowedIn30Days = all.filter(
      (c) => !c.lastFollowUpAt || now - c.lastFollowUpAt.getTime() > 30 * 86400000,
    ).length;
    return { total, notContacted, contactedIn7Days, notFollowedIn30Days };
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    if (!data.company) throw new BadRequestException('公司名称不能为空');
    const customerNo = data.customerNo || generateCustomerNo(this.db);
    try {
      const rows = this.db
        .insert(schema.customer)
        .values({
          customerNo,
          company: data.company,
          country: data.country,
          city: data.city,
          background: data.background,
          scale: data.scale,
          employeeCount: data.employeeCount,
          foundedYear: data.foundedYear,
          source: data.source ?? 'manual',
          contactPerson: data.contactPerson,
          whatsapp: data.whatsapp,
          googleAddress: data.googleAddress,
          facebook: data.facebook,
          website: data.website,
          email: data.email,
          instagram: data.instagram,
          linkedin: data.linkedin,
          contactInvalid: JSON.stringify(data.contactInvalid ?? {}) as any,
          customerType: data.customerType,
          priority: data.priority ?? 'C',
          brandUsed: data.brandUsed,
          businessDetail: data.businessDetail,
        })
        .returning()
        .all();
      return toCustomer(rows[0]);
    } catch (error) {
      if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictException('客户编号已存在');
      }
      throw error;
    }
  }

  async createFromInquiry(inquiryId: number): Promise<Customer> {
    const inquiry = this.db
      .select()
      .from(schema.inquiry)
      .where(eq(schema.inquiry.id, inquiryId))
      .get();
    if (!inquiry) throw new NotFoundException('询盘不存在');

    // Check duplicate by company
    if (inquiry.company) {
      const existing = this.db
        .select()
        .from(schema.customer)
        .where(eq(schema.customer.company, inquiry.company))
        .get();
      if (existing) {
        return toCustomer(existing);
      }
    }

    const customerNo = generateCustomerNo(this.db);
    const rows = this.db
      .insert(schema.customer)
      .values({
        customerNo,
        company: inquiry.company || inquiry.name || 'Unknown',
        country: inquiry.country,
        contactPerson: inquiry.name,
        whatsapp: inquiry.whatsapp,
        email: inquiry.email,
        source: 'inquiry',
        businessDetail: inquiry.productName
          ? `感兴趣产品: ${inquiry.productName}${inquiry.productItemNumber ? ' (' + inquiry.productItemNumber + ')' : ''}\n${inquiry.message || ''}`
          : inquiry.message,
        priority: 'B',
      })
      .returning()
      .all();
    return toCustomer(rows[0]);
  }

  async update(id: number, data: Partial<Customer>): Promise<Customer> {
    const patch: Partial<typeof schema.customer.$inferInsert> = {};
    if (data.company !== undefined) patch.company = data.company;
    if (data.country !== undefined) patch.country = data.country;
    if (data.city !== undefined) patch.city = data.city;
    if (data.background !== undefined) patch.background = data.background;
    if (data.scale !== undefined) patch.scale = data.scale;
    if (data.employeeCount !== undefined) patch.employeeCount = data.employeeCount;
    if (data.foundedYear !== undefined) patch.foundedYear = data.foundedYear;
    if (data.contactPerson !== undefined) patch.contactPerson = data.contactPerson;
    if (data.whatsapp !== undefined) patch.whatsapp = data.whatsapp;
    if (data.googleAddress !== undefined) patch.googleAddress = data.googleAddress;
    if (data.facebook !== undefined) patch.facebook = data.facebook;
    if (data.website !== undefined) patch.website = data.website;
    if (data.email !== undefined) patch.email = data.email;
    if (data.instagram !== undefined) patch.instagram = data.instagram;
    if (data.linkedin !== undefined) patch.linkedin = data.linkedin;
    if (data.contactInvalid !== undefined) patch.contactInvalid = JSON.stringify(data.contactInvalid) as any;
    if (data.customerType !== undefined) patch.customerType = data.customerType;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.brandUsed !== undefined) patch.brandUsed = data.brandUsed;
    if (data.businessDetail !== undefined) patch.businessDetail = data.businessDetail;
    if (Object.keys(patch).length === 0) throw new BadRequestException('未提供可更新字段');
    patch.updatedAt = new Date();

    const rows = this.db
      .update(schema.customer)
      .set(patch)
      .where(eq(schema.customer.id, id))
      .returning()
      .all();
    if (rows.length === 0) throw new NotFoundException('客户不存在');
    return toCustomer(rows[0]);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const rows = this.db
      .delete(schema.customer)
      .where(eq(schema.customer.id, id))
      .returning({ id: schema.customer.id })
      .all();
    if (rows.length === 0) throw new NotFoundException('客户不存在');
    // Also delete followups
    this.db.delete(schema.customerFollowup).where(eq(schema.customerFollowup.customerId, id)).run();
    return { success: true };
  }

  async addFollowup(customerId: number, data: { followDate: string; content?: string; feedback?: string }): Promise<CustomerFollowup> {
    const followDate = new Date(data.followDate);
    const rows = this.db
      .insert(schema.customerFollowup)
      .values({
        customerId,
        followDate,
        content: data.content,
        feedback: data.feedback,
      })
      .returning()
      .all();
    // Update customer lastFollowUpAt
    this.db
      .update(schema.customer)
      .set({ lastFollowUpAt: followDate, updatedAt: new Date() })
      .where(eq(schema.customer.id, customerId))
      .run();
    return toFollowup(rows[0]);
  }

  async removeFollowup(id: number): Promise<{ success: boolean }> {
    const rows = this.db
      .delete(schema.customerFollowup)
      .where(eq(schema.customerFollowup.id, id))
      .returning({ id: schema.customerFollowup.id })
      .all();
    if (rows.length === 0) throw new NotFoundException('跟进记录不存在');
    return { success: true };
  }

  async toggleFollowupReplied(id: number): Promise<{ id: string; isReplied: boolean }> {
    const rows = this.db
      .update(schema.customerFollowup)
      .set({ isReplied: sql`NOT ${schema.customerFollowup.isReplied}` })
      .where(eq(schema.customerFollowup.id, id))
      .returning({ id: schema.customerFollowup.id, isReplied: schema.customerFollowup.isReplied })
      .all();
    if (rows.length === 0) throw new NotFoundException('跟进记录不存在');
    return { id: String(rows[0].id), isReplied: rows[0].isReplied };
  }
}
