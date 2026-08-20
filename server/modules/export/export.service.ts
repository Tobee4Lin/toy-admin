import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { DbType } from '../../database/db';
import { product, category, blogPost } from '../../database/sqlite-schema';

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
      const catSlug = row.category ?? '';
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
    return rows.map((row): ExportCategory => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      productCount: row.productCount,
      heroImageUrl: row.heroImageUrl ?? '',
      cardImageUrl: row.cardImageUrl ?? '',
      accentColor: row.accentColor ?? '',
    }));
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
      if (c.slug) map.set(c.slug, c.name);
    }
    return map;
  }
}
