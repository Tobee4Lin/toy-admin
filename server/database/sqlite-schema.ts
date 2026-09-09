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

export const customer = sqliteTable('customer', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerNo: text('customer_no').notNull().unique(),
  company: text('company').notNull(),
  country: text('country'),
  city: text('city'),
  background: text('background'),
  scale: text('scale'),
  employeeCount: text('employee_count'),
  foundedYear: text('founded_year'),
  source: text('source').default('manual'),
  contactPerson: text('contact_person'),
  whatsapp: text('whatsapp'),
  googleAddress: text('google_address'),
  facebook: text('facebook'),
  website: text('website'),
  email: text('email'),
  instagram: text('instagram'),
  linkedin: text('linkedin'),
  contactInvalid: text('contact_invalid', { mode: 'json' }).notNull().default(`{}`),
  customerType: text('customer_type'),
  priority: text('priority').default('C'),
  brandUsed: text('brand_used'),
  businessDetail: text('business_detail'),
  lastFollowUpAt: integer('last_follow_up_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('customer_no_key').on(table.customerNo),
  index('idx_customer_country').on(table.country),
  index('idx_customer_priority').on(table.priority),
]);

export const customerFollowup = sqliteTable('customer_followup', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull(),
  followDate: integer('follow_date', { mode: 'timestamp_ms' }).notNull(),
  content: text('content'),
  feedback: text('feedback'),
  isReplied: integer('is_replied', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_followup_customer_id').on(table.customerId),
]);

export const document = sqliteTable('document', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['quotation', 'pi', 'ci', 'pl'] }).notNull().default('quotation'),
  documentNo: text('document_no').notNull(),
  date: text('date'),
  validity: text('validity'),
  sellerInfo: text('seller_info', { mode: 'json' }),
  buyerInfo: text('buyer_info', { mode: 'json' }),
  items: text('items', { mode: 'json' }),
  terms: text('terms', { mode: 'json' }),
  bankInfo: text('bank_info', { mode: 'json' }),
  notes: text('notes'),
  shippingMark: text('shipping_mark'),
  totalAmount: text('total_amount'),
  currency: text('currency').default('USD'),
  status: text('status', { enum: ['draft', 'sent', 'confirmed'] }).default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_document_type').on(table.type),
  uniqueIndex('document_no_unique').on(table.documentNo),
]);

export const categoryTable = category;
export const productTable = product;
export const blogPostTable = blogPost;
export const inquiryTable = inquiry;
export const customerTable = customer;
export const customerFollowupTable = customerFollowup;
export const documentTable = document;

// AI Lead Generation - 获客搜索任务与结果
export const aiLeadSearch = sqliteTable('ai_lead_search', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productName: text('product_name').notNull(),
  keywords: text('keywords', { mode: 'json' }).notNull().default(`[]`),
  hsCode: text('hs_code'),
  industry: text('industry'),
  targetCountries: text('target_countries', { mode: 'json' }).notNull().default(`[]`),
  targetCustomerTypes: text('target_customer_types', { mode: 'json' }).notNull().default(`[]`),
  status: text('status', { enum: ['pending', 'searching', 'completed', 'failed'] }).notNull().default('pending'),
  resultCount: integer('result_count').notNull().default(0),
  searchStrategy: text('search_strategy', { mode: 'json' }),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
}, (table) => [
  index('idx_ai_lead_status').on(table.status),
  index('idx_ai_lead_created').on(table.createdAt),
]);

export const aiLead = sqliteTable('ai_lead', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  searchId: integer('search_id').notNull(),
  companyName: text('company_name').notNull(),
  website: text('website'),
  country: text('country'),
  city: text('city'),
  industry: text('industry'),
  businessType: text('business_type'),
  companySize: text('company_size'),
  estimatedScale: text('estimated_scale'),
  productRelevance: text('product_relevance'),
  potentialCustomerType: text('potential_customer_type'),
  email: text('email'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  linkedin: text('linkedin'),
  facebook: text('facebook'),
  instagram: text('instagram'),
  contactPerson: text('contact_person'),
  jobTitle: text('job_title'),
  leadScore: integer('lead_score').notNull().default(0),
  leadGrade: text('lead_grade', { enum: ['A', 'B', 'C', 'D'] }).notNull().default('C'),
  scoreDetails: text('score_details', { mode: 'json' }),
  isSaved: integer('is_saved', { mode: 'boolean' }).notNull().default(false),
  savedCustomerId: integer('saved_customer_id'),
  source: text('source'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_ai_lead_search_id').on(table.searchId),
  index('idx_ai_lead_grade').on(table.leadGrade),
  index('idx_ai_lead_score').on(table.leadScore),
]);

// AI Customer Intelligence - 客户背调报告
export const aiIntelligenceReport = sqliteTable('ai_intelligence_report', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyName: text('company_name').notNull(),
  website: text('website'),
  status: text('status', { enum: ['pending', 'analyzing', 'completed', 'failed'] }).notNull().default('pending'),
  basicInfo: text('basic_info', { mode: 'json' }),
  businessInfo: text('business_info', { mode: 'json' }),
  mainProducts: text('main_products', { mode: 'json' }),
  brandInfo: text('brand_info', { mode: 'json' }),
  marketCoverage: text('market_coverage', { mode: 'json' }),
  socialMedia: text('social_media', { mode: 'json' }),
  companyPotential: text('company_potential', { mode: 'json' }),
  riskAnalysis: text('risk_analysis', { mode: 'json' }),
  purchaseProbability: text('purchase_probability'),
  recommendation: text('recommendation', { mode: 'json' }),
  contacts: text('contacts', { mode: 'json' }),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
}, (table) => [
  index('idx_ai_intel_status').on(table.status),
  index('idx_ai_intel_company').on(table.companyName),
]);

// AI Outreach - AI开发信
export const aiOutreach = sqliteTable('ai_outreach', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id'),
  customerName: text('customer_name').notNull(),
  productName: text('product_name'),
  targetCountry: text('target_country'),
  strategy: text('strategy', { mode: 'json' }),
  coldEmail: text('cold_email', { mode: 'json' }),
  linkedinMessage: text('linkedin_message'),
  facebookMessage: text('facebook_message'),
  whatsappMessage: text('whatsapp_message'),
  status: text('status', { enum: ['draft', 'sent', 'replied', 'ignored'] }).notNull().default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
}, (table) => [
  index('idx_ai_outreach_customer').on(table.customerId),
  index('idx_ai_outreach_status').on(table.status),
]);

// Email Center - 邮箱账户
export const emailAccount = sqliteTable('email_account', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  provider: text('provider', { enum: ['gmail', 'outlook', 'smtp'] }).notNull(),
  smtpHost: text('smtp_host'),
  smtpPort: integer('smtp_port'),
  smtpSecure: integer('smtp_secure', { mode: 'boolean' }).notNull().default(false),
  imapHost: text('imap_host'),
  imapPort: integer('imap_port'),
  username: text('username'),
  password: text('password'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  uniqueIndex('email_account_email_key').on(table.email),
]);

// Email Center - 邮件消息
export const emailMessage = sqliteTable('email_message', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull(),
  messageId: text('message_id'),
  threadId: text('thread_id'),
  direction: text('direction', { enum: ['inbound', 'outbound'] }).notNull(),
  subject: text('subject'),
  fromName: text('from_name'),
  fromEmail: text('from_email').notNull(),
  toEmail: text('to_email', { mode: 'json' }).notNull().default(`[]`),
  ccEmail: text('cc_email', { mode: 'json' }).default(`[]`),
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  aiCategory: text('ai_category', { enum: ['interested', 'price_request', 'sample_request', 'not_interested', 'have_supplier', 'follow_up_later', 'no_response', 'uncategorized'] }).notNull().default('uncategorized'),
  aiSummary: text('ai_summary'),
  aiDraftReply: text('ai_draft_reply'),
  customerId: integer('customer_id'),
  sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
  receivedAt: integer('received_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_email_account').on(table.accountId),
  index('idx_email_direction').on(table.direction),
  index('idx_email_category').on(table.aiCategory),
  index('idx_email_customer').on(table.customerId),
  index('idx_email_thread').on(table.threadId),
]);

export const aiLeadSearchTable = aiLeadSearch;
export const aiLeadTable = aiLead;
export const aiIntelligenceReportTable = aiIntelligenceReport;
export const aiOutreachTable = aiOutreach;
export const emailAccountTable = emailAccount;
export const emailMessageTable = emailMessage;

// Maps Scraper
export const mapsScraperTask = sqliteTable('maps_scraper_task', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  country: text('country').notNull(),
  state: text('state'),
  city: text('city'),
  keyword: text('keyword').notNull(),
  perArea: integer('per_area').notNull().default(10),
  extractEmail: integer('extract_email', { mode: 'boolean' }).notNull().default(true),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed', 'stopped'] }).notNull().default('pending'),
  totalAreas: integer('total_areas').notNull().default(0),
  completedAreas: integer('completed_areas').notNull().default(0),
  failedAreas: integer('failed_areas').notNull().default(0),
  totalResults: integer('total_results').notNull().default(0),
  logs: text('logs', { mode: 'json' }).notNull().default('[]'),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_maps_task_status').on(table.status),
]);

export const mapsScraperResult = sqliteTable('maps_scraper_result', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull(),
  keyword: text('keyword'),
  industry: text('industry'),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  website: text('website'),
  rating: text('rating'),
  reviewsCount: integer('reviews_count'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  addedToCustomer: integer('added_to_customer', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_maps_result_task').on(table.taskId),
  index('idx_maps_result_name').on(table.name),
]);

export const mapsScraperPreset = sqliteTable('maps_scraper_preset', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  country: text('country').notNull(),
  state: text('state'),
  city: text('city'),
  keyword: text('keyword').notNull(),
  perArea: integer('per_area').notNull().default(10),
  extractEmail: integer('extract_email', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const mapsScraperTaskTable = mapsScraperTask;
export const mapsScraperResultTable = mapsScraperResult;
export const mapsScraperPresetTable = mapsScraperPreset;

// Video Marketing (MoneyPrinterTurbo)
export const videoTask = sqliteTable('video_task', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  videoScript: text('video_script'),
  aspectRatio: text('aspect_ratio', { enum: ['9:16', '16:9', '1:1'] }).notNull().default('9:16'),
  voiceProvider: text('voice_provider').default('edge'),
  voiceName: text('voice_name'),
  voiceLanguage: text('voice_language').default('en-US'),
  voiceRate: text('voice_rate').default('1.0'),
  subtitleEnabled: integer('subtitle_enabled', { mode: 'boolean' }).notNull().default(true),
  bgmEnabled: integer('bgm_enabled', { mode: 'boolean' }).notNull().default(true),
  materialSource: text('material_source').default('pexels'),
  videoCount: integer('video_count').notNull().default(1),
  paragraphCount: integer('paragraph_count').notNull().default(3),
  relatedProductId: integer('related_product_id'),
  mptTaskId: text('mpt_task_id'),
  status: text('status', { enum: ['pending', 'generating', 'completed', 'failed', 'cancelled'] }).notNull().default('pending'),
  progress: integer('progress').notNull().default(0),
  videoUrl: text('video_url'),
  videoPath: text('video_path'),
  coverUrl: text('cover_url'),
  duration: integer('duration'),
  errorMessage: text('error_message'),
  logs: text('logs', { mode: 'json' }).notNull().default('[]'),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
}, (table) => [
  index('idx_video_task_status').on(table.status),
]);

export const videoTaskTable = videoTask;
