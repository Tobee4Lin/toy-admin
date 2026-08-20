import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { DbType } from '../../database/db';
import { product, category, blogPost } from '../../database/sqlite-schema';
import { writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'fs';
import { join, resolve, dirname, basename } from 'path';

export interface ExportProduct {
  id: string;
  slug: string;
  name: string;
  itemNumber: string;
  category: string;
  categoryLabel: string;
  description: string;
  features: string[];
  moq: number;
  customizable: boolean;
  customizationOptions: string[];
  packaging: string;
  leadTime: string;
  ageRange: string;
  imageUrl: string;
  galleryImages: string[];
  certifications: string[];
  isFeatured: boolean;
}

export interface ExportCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  heroImageUrl: string;
  cardImageUrl: string;
  accentColor: string;
}

export interface ExportBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorAvatar: string;
  date: string;
  readingTime: string;
  coverImage: string;
  content: string[];
}

@Injectable()
export class ExportService {
  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
  ) {}

  async exportProducts(): Promise<ExportProduct[]> {
    const rows = await this.db.select().from(product).orderBy(product.name);
    const categoryMap = await this.buildCategoryMap();

    return rows.map((row): ExportProduct => {
      const rawCat = row.category ?? '';
      const catSlug = rawCat.toLowerCase().replace(/\s+/g, '-');
      return {
        id: String(row.id),
        slug: row.slug,
        name: row.name,
        itemNumber: row.itemNumber ?? '',
        category: catSlug,
        categoryLabel: categoryMap.get(catSlug) ?? '',
        description: row.description ?? '',
        features: (row.features as string[]) ?? [],
        moq: row.moq ?? 0,
        customizable: row.customizationAvailable,
        customizationOptions: [],
        packaging: row.packagingInfo ?? '',
        leadTime: row.leadTime ?? '',
        ageRange: row.ageGroup ?? '',
        imageUrl: row.imageUrl ?? '',
        galleryImages: (row.gallery as string[]) ?? [],
        certifications: [],
        isFeatured: row.isFeatured,
      };
    });
  }

  async exportCategories(): Promise<ExportCategory[]> {
    const rows = await this.db.select().from(category).orderBy(category.name);
    // 统计每个分类的实际产品数量
    const allProducts = await this.db.select({ category: product.category }).from(product);
    const productCountMap = new Map<string, number>();
    for (const p of allProducts) {
      const cat = (p.category || '').toLowerCase().replace(/\s+/g, '-');
      productCountMap.set(cat, (productCountMap.get(cat) || 0) + 1);
    }

    return rows.map((row): ExportCategory => {
      const normalizedSlug = (row.slug || '').toLowerCase().replace(/\s+/g, '-');
      return {
        id: String(row.id),
        name: row.name,
        slug: normalizedSlug || row.slug,
        description: row.description ?? '',
        productCount: productCountMap.get(normalizedSlug) || 0,
        heroImageUrl: row.heroImageUrl ?? '',
        cardImageUrl: row.cardImageUrl ?? '',
        accentColor: row.accentColor ?? '',
      };
    });
  }

  async exportBlog(): Promise<ExportBlogPost[]> {
    const rows = await this.db.select().from(blogPost).orderBy(blogPost.title);
    return rows.map((row): ExportBlogPost => ({
      id: String(row.id),
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? '',
      category: row.category ?? '',
      author: row.author ?? '',
      authorAvatar: row.authorAvatar ?? '',
      date: row.date ?? '',
      readingTime: row.readingTime ?? '',
      coverImage: row.coverImage ?? '',
      content: (row.content as string[]) ?? [],
    }));
  }

  private async buildCategoryMap(): Promise<Map<string, string>> {
    const cats = await this.db
      .select({ slug: category.slug, name: category.name })
      .from(category);
    const map = new Map<string, string>();
    for (const c of cats) {
      if (c.slug) {
        const normalized = c.slug.toLowerCase().replace(/\s+/g, '-');
        map.set(normalized, c.name);
      }
    }
    return map;
  }

  async syncToFrontend(): Promise<{ success: boolean; message: string; files: string[]; images: number }> {
    const dataDir = process.env.FRONTEND_DATA_DIR || resolve(process.cwd(), '..', 'app_17cbtkkekfv', 'src', 'data');
    
    if (!existsSync(dataDir)) {
      return {
        success: false,
        message: `前台数据目录不存在: ${dataDir}。请在 .env 中设置 FRONTEND_DATA_DIR 指向前台项目的 src/data 目录。`,
        files: [],
        images: 0,
      };
    }

    // 前台项目根目录（dataDir 的上两级）
    const frontendRoot = resolve(dataDir, '..', '..');
    const frontendUploadDir = join(frontendRoot, 'public', 'images', 'uploads');
    const backendUploadDir = resolve(process.cwd(), 'server', 'public', 'uploads');

    const files: string[] = [];
    let imageCount = 0;

    try {
      const products = await this.exportProducts();
      const categories = await this.exportCategories();
      const blogs = await this.exportBlog();

      // 收集所有图片文件名
      const imageFiles = new Set<string>();
      
      // 从产品中收集图片
      for (const p of products) {
        if (p.imageUrl) imageFiles.add(basename(p.imageUrl));
        for (const img of p.galleryImages || []) {
          if (img) imageFiles.add(basename(img));
        }
      }
      // 从分类中收集图片
      for (const c of categories) {
        if (c.heroImageUrl) imageFiles.add(basename(c.heroImageUrl));
        if (c.cardImageUrl) imageFiles.add(basename(c.cardImageUrl));
      }
      // 从博客中收集图片
      for (const b of blogs) {
        if (b.authorAvatar) imageFiles.add(basename(b.authorAvatar));
        if (b.coverImage) imageFiles.add(basename(b.coverImage));
      }

      // 创建前台上传目录
      if (!existsSync(frontendUploadDir)) {
        mkdirSync(frontendUploadDir, { recursive: true });
      }

      // 复制图片文件到前台
      for (const filename of imageFiles) {
        const srcPath = join(backendUploadDir, filename);
        const destPath = join(frontendUploadDir, filename);
        if (existsSync(srcPath)) {
          copyFileSync(srcPath, destPath);
          imageCount++;
        }
      }

      // 转换图片 URL：/api/upload/file/xxx.jpg -> /images/uploads/xxx.jpg
      const convertUrl = (url: string): string => {
        if (!url) return url;
        if (url.startsWith('/api/upload/file/')) {
          return '/images/uploads/' + basename(url);
        }
        return url;
      };

      // 转换产品图片
      const convertedProducts = products.map(p => ({
        ...p,
        imageUrl: convertUrl(p.imageUrl),
        galleryImages: (p.galleryImages || []).map(convertUrl),
      }));

      // 转换分类图片，为空时自动回填默认分类背景图
      const convertedCategories = categories.map(c => {
        const normalizedSlug = (c.slug || '').toLowerCase().replace(/\s+/g, '-');
        const defaultImage = `/images/categories/${normalizedSlug}.jpg`;
        return {
          ...c,
          slug: normalizedSlug || c.slug,
          heroImageUrl: convertUrl(c.heroImageUrl) || defaultImage,
          cardImageUrl: convertUrl(c.cardImageUrl) || defaultImage,
        };
      });

      // 转换博客图片
      const convertedBlogs = blogs.map(b => ({
        ...b,
        authorAvatar: convertUrl(b.authorAvatar),
        coverImage: convertUrl(b.coverImage),
      }));

      // 写入 JSON 文件（UTF-8 with BOM 确保中文正确）
      writeFileSync(join(dataDir, 'products.json'), JSON.stringify(convertedProducts, null, 2), 'utf-8');
      files.push('products.json');

      writeFileSync(join(dataDir, 'categories.json'), JSON.stringify(convertedCategories, null, 2), 'utf-8');
      files.push('categories.json');

      writeFileSync(join(dataDir, 'blog.json'), JSON.stringify(convertedBlogs, null, 2), 'utf-8');
      files.push('blog.json');

      return {
        success: true,
        message: `已成功同步 ${files.length} 个数据文件和 ${imageCount} 张图片到前台项目。`,
        files,
        images: imageCount,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `同步失败: ${err instanceof Error ? err.message : String(err)}`,
        files,
        images: imageCount,
      };
    }
  }
}
