import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import * as schema from '../../database/sqlite-schema';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { DbType } from '../../database/db';
import type { PaginatedResponse, Product } from '@shared/api.interface';

function extractSqliteErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    const code = (error as { code?: string }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

function toProduct(row: typeof schema.product.$inferSelect): Product {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    itemNumber: row.itemNumber ?? '',
    category: row.category ?? '',
    description: row.description ?? '',
    features: (row.features as string[]) ?? [],
    specifications: (row.specifications as Record<string, string>) ?? {},
    moq: row.moq ?? 0,
    customizationAvailable: row.customizationAvailable,
    imageUrl: row.imageUrl ?? '',
    gallery: (row.gallery as string[]) ?? [],
    packagingInfo: row.packagingInfo ?? '',
    leadTime: row.leadTime ?? '',
    ageGroup: row.ageGroup ?? '',
    priceRange: row.priceRange ?? '',
    isFeatured: row.isFeatured,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

@Injectable()
export class ProductService {
  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
  ) {}

  async findAll(params: {
    search?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Product>> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (params.search) {
      const pattern = `%${params.search.toLowerCase()}%`;
      conditions.push(
        sql`(
          lower(${schema.product.name}) LIKE ${pattern}
          OR lower(${schema.product.itemNumber}) LIKE ${pattern}
          OR lower(${schema.product.description}) LIKE ${pattern}
        )`,
      );
    }
    if (params.category) {
      conditions.push(eq(schema.product.category, params.category));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = this.db
      .select()
      .from(schema.product)
      .where(where)
      .orderBy(desc(schema.product.isFeatured), desc(schema.product.createdAt))
      .limit(pageSize)
      .offset(offset)
      .all();

    const countResult = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.product)
      .where(where)
      .get();

    const total = countResult?.count ?? 0;

    return {
      items: rows.map((row: typeof schema.product.$inferSelect) => toProduct(row)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number): Promise<Product> {
    const row = this.db
      .select()
      .from(schema.product)
      .where(eq(schema.product.id, id))
      .get();
    if (!row) {
      throw new NotFoundException('产品不存在');
    }
    return toProduct(row);
  }

  async create(data: Partial<Product>): Promise<Product> {
    if (!data.name || !data.slug) {
      throw new BadRequestException('名称和 Slug 不能为空');
    }
    try {
      const rows = this.db
        .insert(schema.product)
        .values({
          name: data.name,
          slug: data.slug,
          itemNumber: data.itemNumber,
          category: data.category,
          description: data.description,
          features: data.features ?? [],
          specifications: data.specifications ?? {},
          moq: data.moq,
          customizationAvailable: data.customizationAvailable ?? false,
          imageUrl: data.imageUrl,
          gallery: data.gallery ?? [],
          packagingInfo: data.packagingInfo,
          leadTime: data.leadTime,
          ageGroup: data.ageGroup,
          priceRange: data.priceRange,
          isFeatured: data.isFeatured ?? false,
        })
        .returning()
        .all();
      return toProduct(rows[0]);
    } catch (error: unknown) {
      if (extractSqliteErrorCode(error) === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictException('Slug 已存在');
      }
      throw error;
    }
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    const patch: Partial<typeof schema.product.$inferInsert> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.slug !== undefined) patch.slug = data.slug;
    if (data.itemNumber !== undefined) patch.itemNumber = data.itemNumber;
    if (data.category !== undefined) patch.category = data.category;
    if (data.description !== undefined) patch.description = data.description;
    if (data.features !== undefined) patch.features = data.features as unknown as string[];
    if (data.specifications !== undefined) {
      patch.specifications = data.specifications as unknown as Record<string, string>;
    }
    if (data.moq !== undefined) patch.moq = data.moq;
    if (data.customizationAvailable !== undefined) {
      patch.customizationAvailable = data.customizationAvailable;
    }
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
    if (data.gallery !== undefined) patch.gallery = data.gallery as unknown as string[];
    if (data.packagingInfo !== undefined) patch.packagingInfo = data.packagingInfo;
    if (data.leadTime !== undefined) patch.leadTime = data.leadTime;
    if (data.ageGroup !== undefined) patch.ageGroup = data.ageGroup;
    if (data.priceRange !== undefined) patch.priceRange = data.priceRange;
    if (data.isFeatured !== undefined) patch.isFeatured = data.isFeatured;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    try {
      const rows = this.db
        .update(schema.product)
        .set(patch)
        .where(eq(schema.product.id, id))
        .returning()
        .all();
      if (rows.length === 0) {
        throw new NotFoundException('产品不存在');
      }
      return toProduct(rows[0]);
    } catch (error: unknown) {
      if (extractSqliteErrorCode(error) === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictException('Slug 已存在');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const rows = this.db
      .delete(schema.product)
      .where(eq(schema.product.id, id))
      .returning({ id: schema.product.id })
      .all();
    if (rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }
    return { success: true };
  }

  async batchRemove(ids: number[]): Promise<{ success: boolean; deletedCount: number }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请选择要删除的产品');
    }
    const rows = this.db
      .delete(schema.product)
      .where(inArray(schema.product.id, ids))
      .returning({ id: schema.product.id })
      .all();
    return { success: true, deletedCount: rows.length };
  }

  async toggleFeatured(id: number): Promise<{ id: string; isFeatured: boolean }> {
    const rows = this.db
      .update(schema.product)
      .set({
        isFeatured: sql`NOT ${schema.product.isFeatured}`,
        updatedAt: sql`(unixepoch() * 1000)`,
      })
      .where(eq(schema.product.id, id))
      .returning({ id: schema.product.id, isFeatured: schema.product.isFeatured })
      .all();
    if (rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }
    return { id: String(rows[0].id), isFeatured: rows[0].isFeatured };
  }
}
