import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const admin = sqliteTable('admin', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const category = sqliteTable('category', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  productCount: integer('product_count').notNull().default(0),
  heroImageUrl: text('hero_image_url'),
  cardImageUrl: text('card_image_url'),
  accentColor: text('accent_color'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('category_slug_key').on(table.slug),
]);

export const product = sqliteTable('product', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  itemNumber: text('item_number'),
  category: text('category'),
  description: text('description'),
  features: text('features', { mode: 'json' }).notNull().default(`[]`),
  specifications: text('specifications', { mode: 'json' }).notNull().default(`{}`),
  moq: integer('moq').default(0),
  customizationAvailable: integer('customization_available', { mode: 'boolean' })
    .notNull()
    .default(false),
  imageUrl: text('image_url'),
  gallery: text('gallery', { mode: 'json' }).notNull().default(`[]`),
  packagingInfo: text('packaging_info'),
  leadTime: text('lead_time'),
  ageGroup: text('age_group'),
  priceRange: text('price_range'),
  isFeatured: integer('is_featured', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('product_slug_key').on(table.slug),
  index('idx_product_category').on(table.category),
  index('idx_product_is_featured').on(table.isFeatured),
]);

export const blogPost = sqliteTable('blog_post', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  category: text('category'),
  author: text('author'),
  authorAvatar: text('author_avatar'),
  date: text('date'),
  readingTime: text('reading_time'),
  coverImage: text('cover_image'),
  content: text('content', { mode: 'json' }).notNull().default(`[]`),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('blog_post_slug_key').on(table.slug),
  index('idx_blog_post_category').on(table.category),
]);

export const inquiry = sqliteTable('inquiry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  company: text('company'),
  country: text('country'),
  email: text('email'),
  whatsapp: text('whatsapp'),
  estimatedQuantity: text('estimated_quantity'),
  productName: text('product_name'),
  productItemNumber: text('product_item_number'),
  productCategory: text('product_category'),
  pageUrl: text('page_url'),
  message: text('message'),
  source: text('source').default('rfq'),
  status: text('status').notNull().default('new'),
  customizationRequirement: text('customization_requirement'),
  selectedProducts: text('selected_products', { mode: 'json' })
    .notNull()
    .default(`[]`),
  productInterest: text('product_interest'),
  sourcePage: text('source_page'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_inquiry_status').on(table.status),
  index('idx_inquiry_created_at').on(table.createdAt),
]);

export const categoryTable = category;
export const productTable = product;
export const blogPostTable = blogPost;
export const inquiryTable = inquiry;
