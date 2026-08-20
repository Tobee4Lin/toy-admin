export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  heroImageUrl: string;
  cardImageUrl: string;
  accentColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  itemNumber: string;
  category: string;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  moq: number;
  customizationAvailable: boolean;
  imageUrl: string;
  gallery: string[];
  packagingInfo: string;
  leadTime: string;
  ageGroup: string;
  priceRange: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  authorAvatar: string;
  date: string;
  readingTime: string;
  coverImage: string;
  content: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SelectedProduct {
  itemNumber: string;
  name: string;
  quantity: number;
}

export interface Inquiry {
  id: string;
  name: string;
  company: string;
  country: string;
  email: string;
  whatsapp: string;
  estimatedQuantity: string;
  productName: string;
  productItemNumber: string;
  productCategory: string;
  pageUrl: string;
  message: string;
  customizationRequirement: string;
  selectedProducts: SelectedProduct[];
  productInterest: string;
  sourcePage: string;
  source: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InquiryListResponse extends PaginatedResponse<Inquiry> {
  newInquiries: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalBlogPosts: number;
  newInquiries: number;
}

export interface PublicInquirySubmitRequest {
  name: string;
  company: string;
  country: string;
  email: string;
  whatsapp?: string;
  estimatedQuantity?: string;
  message?: string;
  productName?: string;
  itemNumber?: string;
  category?: string;
  pageUrl?: string;
  customizationRequirement?: string;
  source?: string;
  selectedProducts?: SelectedProduct[];
}

export interface PublicLeadSubmitRequest {
  name: string;
  company: string;
  country: string;
  email: string;
  whatsapp?: string;
  productInterest?: string;
  sourcePage?: string;
  category?: string;
}

export interface PublicSubmitResponse {
  success: boolean;
  message: string;
  inquiryId?: string;
  downloadUrl?: string;
}

export interface CategoryDistribution {
  categoryName: string;
  productCount: number;
  accentColor: string;
}
