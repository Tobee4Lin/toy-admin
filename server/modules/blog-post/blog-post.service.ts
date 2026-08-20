import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { blogPost } from '../../database/sqlite-schema';
import type { DbType } from '../../database/db';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { BlogPost, PaginatedResponse } from '@shared/api.interface';

interface FindAllParams {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

type BlogPostRow = typeof blogPost.$inferSelect;

function toDto(row: BlogPostRow): BlogPost {
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? '',
    category: row.category ?? '',
    author: row.author ?? '',
    authorAvatar: row.authorAvatar ?? '',
    date: row.date ?? '',
    readingTime: row.readingTime ?? '',
    coverImage: row.coverImage ?? '',
    content: (row.content as string[]) ?? [],
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return true;
  if (typeof err.message === 'string' && /UNIQUE constraint failed/i.test(err.message)) return true;
  return false;
}

@Injectable()
export class BlogPostService {
  private readonly logger = new Logger(BlogPostService.name);

  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
  ) {}

  async findAll(params: FindAllParams): Promise<PaginatedResponse<BlogPost>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (params.search) {
      const searchTerm = `%${params.search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`lower(${blogPost.title}) like ${searchTerm}`,
          sql`lower(${blogPost.excerpt}) like ${searchTerm}`,
        ),
      );
    }
    if (params.category) {
      conditions.push(eq(blogPost.category, params.category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow, rows] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(blogPost)
        .where(whereClause)
        .get(),
      this.db
        .select()
        .from(blogPost)
        .where(whereClause)
        .orderBy(desc(blogPost.createdAt))
        .limit(pageSize)
        .offset(offset)
        .all(),
    ]);

    const total = countRow?.count ?? 0;
    const items: BlogPost[] = rows.map((row: BlogPostRow) => toDto(row));

    return { items, total, page, pageSize };
  }

  async findOne(id: number): Promise<BlogPost> {
    const row: BlogPostRow | undefined = await this.db
      .select()
      .from(blogPost)
      .where(eq(blogPost.id, id))
      .get();
    if (!row) {
      throw new NotFoundException('博客文章不存在');
    }
    return toDto(row);
  }

  async create(data: Partial<BlogPost> & { title: string; slug: string }): Promise<BlogPost> {
    if (!data.title) {
      throw new BadRequestException('标题不能为空');
    }
    if (!data.slug) {
      throw new BadRequestException('Slug 不能为空');
    }

    try {
      const inserted = await this.db
        .insert(blogPost)
        .values({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt ?? null,
          category: data.category ?? null,
          author: data.author ?? null,
          authorAvatar: data.authorAvatar ?? null,
          date: data.date ?? null,
          readingTime: data.readingTime ?? null,
          coverImage: data.coverImage ?? null,
          content: data.content ?? [],
        })
        .returning()
        .get();
      return toDto(inserted);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Slug 已存在，请使用其他 Slug');
      }
      this.logger.error(`创建博客失败: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async update(id: number, data: Partial<BlogPost>): Promise<BlogPost> {
    const patch: Partial<typeof blogPost.$inferInsert> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.slug !== undefined) patch.slug = data.slug;
    if (data.excerpt !== undefined) patch.excerpt = data.excerpt;
    if (data.category !== undefined) patch.category = data.category;
    if (data.author !== undefined) patch.author = data.author;
    if (data.authorAvatar !== undefined) patch.authorAvatar = data.authorAvatar;
    if (data.date !== undefined) patch.date = data.date;
    if (data.readingTime !== undefined) patch.readingTime = data.readingTime;
    if (data.coverImage !== undefined) patch.coverImage = data.coverImage;
    if (data.content !== undefined) {
      patch.content = data.content as unknown as typeof blogPost.$inferInsert.content;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    try {
      const updated = await this.db
        .update(blogPost)
        .set(patch)
        .where(eq(blogPost.id, id))
        .returning()
        .get();
      if (!updated) {
        throw new NotFoundException('博客文章不存在');
      }
      return toDto(updated);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Slug 已存在，请使用其他 Slug');
      }
      this.logger.error(`更新博客失败: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const deleted = await this.db
      .delete(blogPost)
      .where(eq(blogPost.id, id))
        .returning({ id: blogPost.id })
      .get();
    if (!deleted) {
      throw new NotFoundException('博客文章不存在');
    }
    return { success: true };
  }
}
