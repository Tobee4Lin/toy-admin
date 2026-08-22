import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import * as schema from '../../database/sqlite-schema';
import { DATABASE_PROVIDER } from '../database/database.module';
import { Inject } from '@nestjs/common';
import type { DbType } from '../../database/db';

export interface DocumentItem {
  id: string;
  image?: string;
  description: string;
  specs?: string;
  moq?: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  amount?: number;
  // PL specific
  cartons?: number;
  ctnSize?: string;
  grossWeight?: number;
  netWeight?: number;
  cbm?: number;
}

export interface SellerInfo {
  companyName: string;
  email: string;
  tel: string;
  address: string;
  logo?: string;
}

export interface BuyerInfo {
  companyName: string;
  attn?: string;
  address: string;
  tel?: string;
  email?: string;
}

export interface DocumentTerms {
  priceTerm?: string;
  paymentTerm?: string;
  deliveryTime?: string;
  port?: string;
  other?: string;
}

export interface BankInfo {
  bankName?: string;
  bankAddress?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;
}

export interface DocumentData {
  id?: number;
  type: 'quotation' | 'pi' | 'ci' | 'pl';
  documentNo: string;
  date?: string;
  validity?: string;
  sellerInfo?: SellerInfo;
  buyerInfo?: BuyerInfo;
  items?: DocumentItem[];
  terms?: DocumentTerms;
  bankInfo?: BankInfo;
  notes?: string;
  totalAmount?: string;
  currency?: string;
  status?: 'draft' | 'sent' | 'confirmed';
}

@Injectable()
export class DocumentService {
  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
  ) {}

  async findAll(type?: string): Promise<DocumentData[]> {
    const conditions = [];
    if (type && ['quotation', 'pi', 'ci', 'pl'].includes(type)) {
      conditions.push(eq(schema.document.type, type as 'quotation' | 'pi' | 'ci' | 'pl'));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = this.db
      .select()
      .from(schema.document)
      .where(where)
      .orderBy(desc(schema.document.createdAt))
      .all();
    return rows.map((row) => this.toDocumentData(row));
  }

  async findOne(id: number): Promise<DocumentData> {
    const row = this.db
      .select()
      .from(schema.document)
      .where(eq(schema.document.id, id))
      .get();
    if (!row) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return this.toDocumentData(row);
  }

  async create(data: DocumentData): Promise<DocumentData> {
    const docNo = data.documentNo || this.generateDocNo(data.type);
    const result = this.db
      .insert(schema.document)
      .values({
        type: data.type,
        documentNo: docNo,
        date: data.date,
        validity: data.validity,
        sellerInfo: data.sellerInfo ? JSON.stringify(data.sellerInfo) : null,
        buyerInfo: data.buyerInfo ? JSON.stringify(data.buyerInfo) : null,
        items: data.items ? JSON.stringify(data.items) : null,
        terms: data.terms ? JSON.stringify(data.terms) : null,
        bankInfo: data.bankInfo ? JSON.stringify(data.bankInfo) : null,
        notes: data.notes,
        totalAmount: data.totalAmount,
        currency: data.currency || 'USD',
        status: data.status || 'draft',
      })
      .returning()
      .get();
    return this.toDocumentData(result);
  }

  async update(id: number, data: Partial<DocumentData>): Promise<DocumentData> {
    const existing = this.db
      .select()
      .from(schema.document)
      .where(eq(schema.document.id, id))
      .get();
    if (!existing) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    const result = this.db
      .update(schema.document)
      .set({
        ...(data.type !== undefined && { type: data.type }),
        ...(data.documentNo !== undefined && { documentNo: data.documentNo }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.validity !== undefined && { validity: data.validity }),
        ...(data.sellerInfo !== undefined && {
          sellerInfo: data.sellerInfo ? JSON.stringify(data.sellerInfo) : null,
        }),
        ...(data.buyerInfo !== undefined && {
          buyerInfo: data.buyerInfo ? JSON.stringify(data.buyerInfo) : null,
        }),
        ...(data.items !== undefined && {
          items: data.items ? JSON.stringify(data.items) : null,
        }),
        ...(data.terms !== undefined && {
          terms: data.terms ? JSON.stringify(data.terms) : null,
        }),
        ...(data.bankInfo !== undefined && {
          bankInfo: data.bankInfo ? JSON.stringify(data.bankInfo) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.status !== undefined && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(schema.document.id, id))
      .returning()
      .get();
    return this.toDocumentData(result);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const existing = this.db
      .select()
      .from(schema.document)
      .where(eq(schema.document.id, id))
      .get();
    if (!existing) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    this.db.delete(schema.document).where(eq(schema.document.id, id)).run();
    return { success: true };
  }

  private generateDocNo(type: string): string {
    const prefix = {
      quotation: 'QT',
      pi: 'PI',
      ci: 'CI',
      pl: 'PL',
    }[type] || 'DOC';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${prefix}${year}${month}${random}`;
  }

  private toDocumentData(row: typeof schema.document.$inferSelect): DocumentData {
    return {
      id: row.id,
      type: row.type as DocumentData['type'],
      documentNo: row.documentNo,
      date: row.date || '',
      validity: row.validity || '',
      sellerInfo: row.sellerInfo ? JSON.parse(row.sellerInfo as string) : undefined,
      buyerInfo: row.buyerInfo ? JSON.parse(row.buyerInfo as string) : undefined,
      items: row.items ? JSON.parse(row.items as string) : [],
      terms: row.terms ? JSON.parse(row.terms as string) : undefined,
      bankInfo: row.bankInfo ? JSON.parse(row.bankInfo as string) : undefined,
      notes: row.notes || '',
      totalAmount: row.totalAmount || '0',
      currency: row.currency || 'USD',
      status: row.status as DocumentData['status'],
    };
  }
}
