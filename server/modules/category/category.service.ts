import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '../../database/sqlite-schema';
import type { DbType } from '../../database/db';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { Category } from '@shared/api.interface';

function extractSqliteErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    const code = (error as { code?: string }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

function toCategory(row: typeof schema.category.$inferSelect): Category {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    productCount: row.productCount,
    heroImageUrl: row.heroImageUrl ?? '',
    cardImageUrl: row.cardImageUrl ?? '',
    accentColor: row.accentColor ?? '',
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

@Injectable()
export class CategoryService {
  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
  ) {}

  async findAll(): Promise<Category[]> {
    const rows: (typeof schema.category.$inferSelect)[] = await this.db
      .select()
      .from(schema.category)
      .orderBy(schema.category.createdAt);
    return rows.map((row: typeof schema.category.$inferSelect) => toCategory(row));
  }

  async create(
    data: Omit<typeof schema.category.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Category> {
    try {
      const rows: (typeof schema.category.$inferSelect)[] = await this.db
        .insert(schema.category)
        .values(data)
        .returning();
      return toCategory(rows[0]);
    } catch (error: unknown) {
      const code = extractSqliteErrorCode(error);
      if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictException('分类标识 (slug) 已存在');
      }
      throw error;
    }
  }

  async update(
    id: number,
    data: Partial<Omit<typeof schema.category.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Category> {
    try {
      const patch: Partial<typeof schema.category.$inferInsert> = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.slug !== undefined) patch.slug = data.slug;
      if (data.description !== undefined) patch.description = data.description;
      if (data.productCount !== undefined) patch.productCount = data.productCount;
      if (data.heroImageUrl !== undefined) patch.heroImageUrl = data.heroImageUrl;
      if (data.cardImageUrl !== undefined) patch.cardImageUrl = data.cardImageUrl;
      if (data.accentColor !== undefined) patch.accentColor = data.accentColor;

      const rows: (typeof schema.category.$inferSelect)[] = await this.db
        .update(schema.category)
        .set(patch)
        .where(eq(schema.category.id, id))
        .returning();
      if (rows.length === 0) {
        throw new NotFoundException('分类不存在');
      }
      return toCategory(rows[0]);
    } catch (error: unknown) {
      const code = extractSqliteErrorCode(error);
      if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictException('分类标识 (slug) 已存在');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const rows: { id: number }[] = await this.db
      .delete(schema.category)
      .where(eq(schema.category.id, id))
      .returning({ id: schema.category.id });
    if (rows.length === 0) {
      throw new NotFoundException('分类不存在');
    }
    return { success: true };
  }
}
