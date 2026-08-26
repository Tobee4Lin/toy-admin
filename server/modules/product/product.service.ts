import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';
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

  // 生成Excel模板
  generateTemplate(): Buffer {
    const headers = [
      '产品名称*',
      '货号(Item No.)',
      '分类Slug(beach-toys/bubble-toys/rc-toys/building-blocks)',
      '产品描述',
      '产品特性(用分号;分隔)',
      'MOQ起订量',
      '是否支持定制(是/否)',
      '主图(填写文件名如product.jpg，或完整URL)',
      '画廊图片(文件名用分号;分隔，或完整URL)',
      '包装信息',
      '交货周期',
      '适用年龄',
      '价格区间',
      '是否精选(是/否)',
    ];

    const sampleData = [
      [
        'Summer Beach Bucket Set',
        'BT-20012',
        'beach-toys',
        '7-piece beach bucket set with shovel, rake and sand molds',
        '7-piece set;Durable plastic;Bright colors',
        500,
        '是',
        'beach-bucket.jpg',
        'beach-bucket-1.jpg;beach-bucket-2.jpg',
        '48 pcs/ctn, 0.12 CBM',
        '25-30 days',
        '3+',
        '$1.20-$1.80',
        '否',
      ],
      [
        'Automatic Bubble Gun',
        'BB-10001',
        'bubble-toys',
        'Electric automatic bubble gun with LED light',
        'Automatic;LED light;Includes bubble solution',
        1000,
        '是',
        'https://example.com/bubble-gun.jpg',
        '',
        '60 pcs/ctn, 0.15 CBM',
        '30-35 days',
        '3+',
        '$2.50-$3.50',
        '是',
      ],
    ];

    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 设置列宽
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 35 }, { wch: 40 }, { wch: 30 },
      { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 20 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '产品导入模板');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(buffer);
  }

  // 解析Excel文件
  parseExcel(buffer: Buffer): Array<Record<string, unknown>> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return jsonData as Array<Record<string, unknown>>;
  }

  // 批量导入产品
  async batchImport(rows: Array<Record<string, unknown>>): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const results: { success: number; failed: number; errors: Array<{ row: number; message: string }> } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel行号，第1行是表头

      try {
        const name = String(row['产品名称*'] || row['产品名称'] || '').trim();
        if (!name) {
          results.failed++;
          results.errors.push({ row: rowNum, message: '产品名称不能为空' });
          continue;
        }

        // 生成slug
        let slug = String(row['Slug'] || '').trim();
        if (!slug) {
          slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100);
          if (!slug) slug = `product-${Date.now()}-${i}`;
        }

        // 检查slug是否已存在
        const existing = this.db
          .select({ id: schema.product.id })
          .from(schema.product)
          .where(eq(schema.product.slug, slug))
          .get();
        if (existing) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }

        const itemNumber = String(row['货号(Item No.)'] || row['货号'] || '').trim();
        const category = String(row['分类Slug(beach-toys/bubble-toys/rc-toys/building-blocks)'] || row['分类'] || '').trim();
        const description = String(row['产品描述'] || '').trim();
        const featuresStr = String(row['产品特性(用分号;分隔)'] || '').trim();
        const features = featuresStr ? featuresStr.split(/[;；]/).map((s: string) => s.trim()).filter(Boolean) : [];
        const moq = parseInt(String(row['MOQ起订量'] || row['MOQ'] || '0'), 10) || 0;
        const customizationStr = String(row['是否支持定制(是/否)'] || row['是否支持定制'] || '否').trim();
        const customizationAvailable = customizationStr === '是' || customizationStr === 'true' || customizationStr === 'yes';
        const imageUrl = String(row['主图(填写文件名如product.jpg，或完整URL)'] || row['主图URL'] || row['主图'] || '').trim();
        const galleryStr = String(row['画廊图片(文件名用分号;分隔，或完整URL)'] || row['画廊图片URL(用分号;分隔)'] || row['画廊图片'] || '').trim();
        const gallery = galleryStr ? galleryStr.split(/[;；]/).map((s: string) => s.trim()).filter(Boolean) : [];
        const packagingInfo = String(row['包装信息'] || '').trim();
        const leadTime = String(row['交货周期'] || '').trim();
        const ageGroup = String(row['适用年龄'] || '').trim();
        const priceRange = String(row['价格区间'] || '').trim();
        const featuredStr = String(row['是否精选(是/否)'] || row['是否精选'] || '否').trim();
        const isFeatured = featuredStr === '是' || featuredStr === 'true' || featuredStr === 'yes';

        this.db
          .insert(schema.product)
          .values({
            name,
            slug,
            itemNumber,
            category,
            description,
            features,
            specifications: {},
            moq,
            customizationAvailable,
            imageUrl,
            gallery,
            packagingInfo,
            leadTime,
            ageGroup,
            priceRange,
            isFeatured,
          } as any)
          .run();

        results.success++;
      } catch (error: unknown) {
        results.failed++;
        const message = error instanceof Error ? error.message : '未知错误';
        results.errors.push({ row: rowNum, message });
      }
    }

    return results;
  }
}
