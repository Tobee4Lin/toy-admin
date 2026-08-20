# 技术方案

## 开发元信息
- 开发模式: 全栈应用
- 涉及层级: [数据库, 服务端, 前端]

## 页面路由与导航

### 页面路由
| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 仪表盘 | 数据概览首页 |
| `/products` | 产品列表 | 产品管理表格 |
| `/products/new` | 产品创建 | 新建产品表单 |
| `/products/:id/edit` | 产品编辑 | 编辑产品表单 |
| `/categories` | 分类管理 | 分类列表与编辑 |
| `/blog` | 博客列表 | 博客文章管理 |
| `/blog/new` | 博客创建 | 新建文章表单 |
| `/blog/:id/edit` | 博客编辑 | 编辑文章表单 |
| `/inquiries` | 询盘管理 | 询盘列表与详情抽屉 |
| `/settings` | 系统设置 | 修改密码与数据导出 |

### 导航设计
- 导航机制：页面路由
- 导航项：
  - 仪表盘（Dashboard）
  - 产品管理（Products）
  - 分类管理（Categories）
  - 博客管理（Blog）
  - 询盘管理（Inquiries）
  - 系统设置（Settings）

## 数据模型

### 数据库设计

#### 分类表（category）
用途：存储产品分类信息，支持前端网站分类展示。
核心字段：
- name: varchar (分类名称)
- slug: varchar (唯一标识，URL友好)
- description: text (分类描述)
- productCount: integer (产品数量)
- heroImageUrl: text (首图URL)
- cardImageUrl: text (卡片图URL)
- accentColor: varchar (强调色，如 #1565FF)

#### 产品表（product）
用途：存储产品完整信息，是系统核心业务表。
核心字段：
- name: varchar (产品名称)
- slug: varchar (唯一标识，URL友好)
- itemNumber: varchar (货号)
- category: varchar (关联分类slug)
- description: text (产品描述)
- features: json (特性列表，JSON数组)
- specifications: json (规格参数，JSON对象)
- moq: integer (最小起订量)
- customizationAvailable: boolean (是否支持定制)
- imageUrl: text (主图URL)
- gallery: json (画廊图片URL数组)
- packagingInfo: text (包装信息)
- leadTime: varchar (交期)
- ageGroup: varchar (适用年龄组)
- priceRange: varchar (价格区间)
- isFeatured: boolean (是否精选)
关联关系：与分类表多对一，通过 category 字段关联 category.slug

#### 博客文章表（blog_post）
用途：存储博客文章内容，用于内容营销。
核心字段：
- title: varchar (文章标题)
- slug: varchar (唯一标识)
- excerpt: text (摘要)
- category: varchar (文章分类)
- author: varchar (作者名)
- authorAvatar: text (作者头像URL)
- date: varchar (发布日期)
- readingTime: varchar (阅读时长)
- coverImage: text (封面图URL)
- content: json (段落内容，JSON数组)

#### 询盘表（inquiry）
用途：存储客户提交的询盘信息，用于销售跟进。
核心字段：
- name: varchar (客户姓名)
- company: varchar (公司名称)
- country: varchar (国家)
- email: varchar (邮箱)
- whatsapp: varchar (WhatsApp号)
- estimatedQuantity: varchar (预估数量)
- productName: varchar (意向产品名称)
- productItemNumber: varchar (意向产品货号)
- productCategory: varchar (意向产品分类)
- pageUrl: text (来源页面URL)
- message: text (留言内容)
- source: varchar ['rfq', 'catalog', 'contact'] (询盘来源)
- status: varchar ['new', 'read', 'replied', 'archived'] (处理状态)

## 业务模型

### API 设计

#### 认证相关
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取当前管理员信息 | 平台能力 | 内置用户系统 (AuthNPaasService) |
| 修改管理员密码 | API | PUT /api/admin/password |

**所需 API**:
```typescript
// 修改管理员密码 [对应页面功能: 系统设置-修改密码]
PUT /api/admin/password
Request: { currentPassword: string; newPassword: string; confirmPassword: string }
Response: { success: boolean; message: string }
```

#### 仪表盘相关
**页面路径**: `/`
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 统计数据卡片 | API | GET /api/dashboard/stats |
| 最近询盘列表 | API | GET /api/dashboard/recent-inquiries |
| 产品分类分布 | API | GET /api/dashboard/category-distribution |

**所需 API**:
```typescript
// 获取仪表盘统计数据 [领域模型: DashboardStats] [对应页面功能: 数据卡片区]
GET /api/dashboard/stats
Response: {
  totalProducts: number;
  totalCategories: number;
  totalBlogPosts: number;
  newInquiries: number;
}

// 获取最近询盘 [领域模型: Inquiry] [对应页面功能: 最近询盘列表]
GET /api/dashboard/recent-inquiries?limit=5
Response: {
  items: Array<{
    id: string;
    name: string;
    company: string;
    productName: string;
    status: string;
    createdAt: string;
  }>;
}

// 获取产品分类分布 [领域模型: Category] [对应页面功能: 产品分类分布图]
GET /api/dashboard/category-distribution
Response: {
  items: Array<{ categoryName: string; productCount: number; accentColor: string }>;
}
```

#### 产品管理相关
**页面路径**: `/products`、`/products/new`、`/products/:id/edit`
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 产品列表（含搜索、筛选、分页） | API | GET /api/products |
| 产品详情 | API | GET /api/products/:id |
| 创建产品 | API | POST /api/products |
| 更新产品 | API | PUT /api/products/:id |
| 删除产品 | API | DELETE /api/products/:id |
| 批量删除产品 | API | DELETE /api/products/batch |
| 切换精选状态 | API | POST /api/products/:id/featured |
| 图片上传 | 平台能力 | 内置文件存储服务 |

**所需 API**:
```typescript
// 获取产品列表 [领域模型: Product] [对应页面功能: 数据表格]
GET /api/products?search=&category=&page=1&pageSize=20
Response: { items: Product[]; total: number }

// 获取产品详情 [领域模型: Product] [对应页面功能: 产品编辑表单]
GET /api/products/:id
Response: Product

// 创建产品 [领域模型: Product] [对应页面功能: 产品创建表单]
POST /api/products
Request: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
Response: Product

// 更新产品 [领域模型: Product] [对应页面功能: 产品编辑表单]
PUT /api/products/:id
Request: Partial<Omit<Product, 'id'>>
Response: Product

// 删除产品 [领域模型: Product] [对应页面功能: 删除操作]
DELETE /api/products/:id
Response: { success: boolean }

// 批量删除产品 [领域模型: Product] [对应页面功能: 批量删除]
DELETE /api/products/batch
Request: { ids: string[] }
Response: { success: boolean; deletedCount: number }

// 切换精选状态 [领域模型: Product] [对应页面功能: 行内切换精选]
POST /api/products/:id/featured
Response: { id: string; isFeatured: boolean }
```

#### 分类管理相关
**页面路径**: `/categories`
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 分类列表 | API | GET /api/categories |
| 创建分类 | API | POST /api/categories |
| 更新分类 | API | PUT /api/categories/:id |
| 删除分类 | API | DELETE /api/categories/:id |
| 图片上传 | 平台能力 | 内置文件存储服务 |

**所需 API**:
```typescript
// 获取全部分类 [领域模型: Category] [对应页面功能: 分类表格]
GET /api/categories
Response: Category[]

// 创建分类 [领域模型: Category] [对应页面功能: 分类编辑弹窗]
POST /api/categories
Request: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
Response: Category

// 更新分类 [领域模型: Category] [对应页面功能: 分类编辑弹窗]
PUT /api/categories/:id
Request: Partial<Omit<Category, 'id'>>
Response: Category

// 删除分类 [领域模型: Category] [对应页面功能: 删除操作]
DELETE /api/categories/:id
Response: { success: boolean }
```

#### 博客管理相关
**页面路径**: `/blog`、`/blog/new`、`/blog/:id/edit`
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 博客列表（含搜索、筛选） | API | GET /api/blog-posts |
| 博客详情 | API | GET /api/blog-posts/:id |
| 创建博客 | API | POST /api/blog-posts |
| 更新博客 | API | PUT /api/blog-posts/:id |
| 删除博客 | API | DELETE /api/blog-posts/:id |
| 图片上传 | 平台能力 | 内置文件存储服务 |

**所需 API**:
```typescript
// 获取博客列表 [领域模型: BlogPost] [对应页面功能: 文章列表]
GET /api/blog-posts?search=&category=&page=1&pageSize=20
Response: { items: BlogPost[]; total: number }

// 获取博客详情 [领域模型: BlogPost] [对应页面功能: 博客编辑表单]
GET /api/blog-posts/:id
Response: BlogPost

// 创建博客 [领域模型: BlogPost] [对应页面功能: 博客创建表单]
POST /api/blog-posts
Request: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>
Response: BlogPost

// 更新博客 [领域模型: BlogPost] [对应页面功能: 博客编辑表单]
PUT /api/blog-posts/:id
Request: Partial<Omit<BlogPost, 'id'>>
Response: BlogPost

// 删除博客 [领域模型: BlogPost] [对应页面功能: 删除操作]
DELETE /api/blog-posts/:id
Response: { success: boolean }
```

#### 询盘管理相关
**页面路径**: `/inquiries`
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 询盘列表（含状态筛选、搜索、分页） | API | GET /api/inquiries |
| 询盘详情 | API | GET /api/inquiries/:id |
| 更新询盘状态 | API | PUT /api/inquiries/:id/status |
| 删除询盘 | API | DELETE /api/inquiries/:id |

**所需 API**:
```typescript
// 获取询盘列表 [领域模型: Inquiry] [对应页面功能: 询盘表格]
GET /api/inquiries?status=&search=&page=1&pageSize=20
Response: { items: Inquiry[]; total: number }

// 获取询盘详情 [领域模型: Inquiry] [对应页面功能: 询盘详情抽屉]
GET /api/inquiries/:id
Response: Inquiry

// 更新询盘状态 [领域模型: Inquiry] [对应页面功能: 状态切换]
PUT /api/inquiries/:id/status
Request: { status: 'new' | 'read' | 'replied' | 'archived' }
Response: { id: string; status: string }

// 删除询盘 [领域模型: Inquiry] [对应页面功能: 删除操作]
DELETE /api/inquiries/:id
Response: { success: boolean }
```

#### 数据导出相关
**页面路径**: `/settings`
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 导出产品 JSON | API | GET /api/export/products |
| 导出分类 JSON | API | GET /api/export/categories |
| 导出博客 JSON | API | GET /api/export/blog |

**所需 API**:
```typescript
// 导出产品数据为前端兼容格式 [领域模型: Product] [对应页面功能: 数据导出区]
GET /api/export/products
Response: JSON file download (products.json)

// 导出分类数据为前端兼容格式 [领域模型: Category] [对应页面功能: 数据导出区]
GET /api/export/categories
Response: JSON file download (categories.json)

// 导出博客数据为前端兼容格式 [领域模型: BlogPost] [对应页面功能: 数据导出区]
GET /api/export/blog
Response: JSON file download (blog.json)
```

## 业务组件
| 组件 | 来源 | 关联页面 | 对应功能点 |
|------|------|---------|-----------|
| DataTable | shadcn/ui + 自建 | 产品列表、询盘管理、分类管理 | 数据表格展示与操作 |
| Sidebar | 自建 | 所有内页 | 侧边栏导航 |
| TopBar | 自建 | 所有内页 | 顶部工具栏 |
| Toast (sonner) | 第三方 | 所有页面 | 操作反馈通知 |
| ConfirmDialog | shadcn/ui AlertDialog | 所有删除操作 | 删除确认弹窗 |
| Drawer (Vaul) | 第三方 | 询盘管理 | 询盘详情抽屉 |
| Tabs | shadcn/ui Tabs | 产品表单 | 表单分区标签 |
| ImageUpload | 自建 | 产品表单、分类管理、博客表单 | 图片上传组件 |
| DynamicList | 自建 | 产品表单、博客表单 | 动态添加/删除列表项 |
| Chart (recharts) | 第三方 | 仪表盘 | 分类分布柱状图 |
