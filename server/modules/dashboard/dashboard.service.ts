import { Inject, Injectable } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { DbType } from '../../database/db';
import {
  blogPost,
  category,
  inquiry,
  product,
} from '../../database/sqlite-schema';
import type {
  CategoryDistribution,
  DashboardStats,
  Inquiry,
} from '@shared/api.interface';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [productRow] = await this.db
      .select({ count: count() })
      .from(product);
    const [categoryRow] = await this.db
      .select({ count: count() })
      .from(category);
    const [blogRow] = await this.db
      .select({ count: count() })
      .from(blogPost);
    const [newInquiryRow] = await this.db
      .select({ count: count() })
      .from(inquiry)
      .where(eq(inquiry.status, 'new'));

    return {
      totalProducts: productRow.count,
      totalCategories: categoryRow.count,
      totalBlogPosts: blogRow.count,
      newInquiries: newInquiryRow.count,
    };
  }

  async getRecentInquiries(
    limit: number,
  ): Promise<{ items: Inquiry[] }> {
    const rows = await this.db
      .select({
        id: inquiry.id,
        name: inquiry.name,
        company: inquiry.company,
        productName: inquiry.productName,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      })
      .from(inquiry)
      .orderBy(desc(inquiry.createdAt))
      .limit(limit);

    const items: Inquiry[] = rows.map((row) => ({
      id: String(row.id),
      name: row.name ?? '',
      company: row.company ?? '',
      country: '',
      email: '',
      whatsapp: '',
      estimatedQuantity: '',
      productName: row.productName ?? '',
      productItemNumber: '',
      productCategory: '',
      pageUrl: '',
      message: '',
      source: '',
      customizationRequirement: '',
      selectedProducts: [],
      productInterest: '',
      sourcePage: '',
      status: (row.status as Inquiry['status']) ?? 'new',
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.createdAt).toISOString(),
    }));

    return { items };
  }

  async getCategoryDistribution(): Promise<{
    items: CategoryDistribution[];
  }> {
    const rows = await this.db
      .select({
        categoryName: category.name,
        accentColor: category.accentColor,
        productCount: count(product.id),
      })
      .from(category)
      .leftJoin(product, eq(product.category, category.slug))
      .groupBy(category.id, category.name, category.accentColor)
      .orderBy(category.name);

    const items: CategoryDistribution[] = rows.map((row) => ({
      categoryName: row.categoryName,
      productCount: row.productCount,
      accentColor: row.accentColor ?? '#1565FF',
    }));

    return { items };
  }
}
