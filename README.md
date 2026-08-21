# Toy Admin Dashboard — 玩具B2B后台管理系统

国际B2B玩具采购网站配套的后台管理系统，支持产品管理、分类管理、博客管理、询盘管理、客户管理CRM、数据导出与前台同步。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | NestJS 10 |
| ORM | Drizzle ORM 0.44 |
| 数据库 | SQLite（本地）/ PostgreSQL（平台） |
| 认证 | JWT + Passport |
| 前端框架 | React 19 + Vite 7 |
| UI 组件 | shadcn/ui + Radix UI + Tailwind CSS 4 |
| 状态管理 | TanStack Query + Zustand |
| 表单 | React Hook Form + Zod |
| 图表 | ECharts / Recharts |
| 语言 | TypeScript（严格模式） |

## 功能模块

### 仪表盘 Dashboard
- 核心数据统计（产品数、分类数、博客数、询盘数）
- 最近询盘列表
- 数据趋势图表

### 产品管理 Products
- 产品 CRUD（增删改查）
- 产品图片上传、多图相册
- 产品规格、MOQ、包装信息、交期
- 推荐产品切换
- 批量删除

### 分类管理 Categories
- 分类 CRUD
- 分类封面图、卡片图、主题色
- 产品数量自动统计

### 博客管理 Blog
- 博客文章 CRUD
- 封面图、分类、作者、阅读时长
- 富文本内容编辑

### 询盘管理 Inquiries
- 询盘列表（状态筛选：新询盘/已读/已回复/已归档）
- 询盘详情抽屉
- 状态流转
- **一键转为客户**（自动带入公司、国家、联系方式）

### 客户管理 CRM
- 客户列表（搜索、联系状态筛选、优先级筛选、分页）
- 4项统计卡片：客户总数、未联系、7天内已联系、超30天未跟进
- 客户编号自动生成（`C` + 年份 + 6位序号，如 `C2026000001`）
- 编辑弹窗 4 个 Tab：
  - **基本信息**：公司、国家、城市、企业背景、规模、员工数、成立年份、来源、客户类型、优先级、使用品牌
  - **联系方式**：联系人、WhatsApp、邮箱、Google地址、Facebook、Instagram、LinkedIn、网站，支持标记失效/恢复
  - **业务信息**：业务详情
  - **跟进记录**：添加跟进内容+客户反馈，标记已回复/未回复，删除记录
- 列表联系方式图标列：WhatsApp / 邮箱一键联系
- **从询盘批量导入**客户（勾选询盘，自动去重）
- **导出Excel**（CSV带BOM，Excel打开中文不乱码）

### 数据导出 Export
- 一键同步产品/分类/博客数据到前台项目 `src/data/` 目录
- 自动复制上传图片到前台 `public/images/uploads/`
- 前台刷新即可看到更新

### 系统设置 Settings
- 前台数据目录配置
- 一键同步到前台

## 项目结构

```
.
├── client/                    # 前端 React 应用
│   ├── src/
│   │   ├── api/              # API 客户端（products, categories, blog, inquiries, customers）
│   │   ├── components/       # 通用组件 + 布局 + UI组件
│   │   ├── pages/            # 页面组件
│   │   │   ├── Dashboard/
│   │   │   ├── Products/
│   │   │   ├── Categories/
│   │   │   ├── Blog/
│   │   │   ├── Inquiries/
│   │   │   ├── Customers/    # 客户管理CRM
│   │   │   ├── Settings/
│   │   │   └── Login/
│   │   ├── utils/            # 工具函数（http, auth）
│   │   └── app.tsx           # 路由配置
│   └── index.html
├── server/                    # 后端 NestJS 应用
│   ├── modules/
│   │   ├── auth/             # 登录认证
│   │   ├── product/          # 产品
│   │   ├── category/         # 分类
│   │   ├── blog-post/        # 博客
│   │   ├── inquiry/          # 询盘
│   │   ├── customer/         # 客户CRM
│   │   ├── dashboard/        # 仪表盘统计
│   │   ├── export/           # 数据导出/同步到前台
│   │   ├── upload/           # 文件上传
│   │   └── database/         # 数据库模块
│   ├── database/
│   │   ├── sqlite-schema.ts  # SQLite 表定义
│   │   ├── schema.ts         # PostgreSQL 表定义（平台用）
│   │   ├── migrate.ts        # 数据库迁移+种子数据
│   │   └── db.ts             # 数据库连接
│   ├── common/               # 过滤器、中间件
│   ├── app.module.ts
│   └── bootstrap.ts          # 本地启动入口
├── shared/                    # 前后端共享类型
│   └── api.interface.ts
├── data/                      # SQLite 数据库文件（运行时生成）
├── public/uploads/            # 上传文件存储
├── dev.js                     # 本地开发启动脚本（前后端并发）
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 环境要求

- **Node.js** >= 18.0.0（推荐 20.x）
- **npm** >= 9.0.0
- 无需安装 Python（better-sqlite3 使用预编译二进制）

> ⚠️ 不要使用 Node 22+，better-sqlite3@11 在 Node 20 下稳定运行。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`（如不存在则手动创建）：

```env
# 服务端口
PORT=3000

# JWT 密钥（生产环境务必修改）
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 前台项目数据目录（用于一键同步）
FRONTEND_DATA_DIR=C:\path\to\toy-website\src\data
FRONTEND_UPLOAD_DIR=C:\path\to\toy-website\public\images\uploads

# 上传目录
UPLOAD_DIR=./server/public/uploads
```

### 3. 启动开发服务器

```bash
npm run dev
```

启动后：
- 前端管理后台：http://localhost:8080
- 后端 API：http://localhost:3000

### 4. 默认账号

```
用户名：admin
密码：admin123
```

首次启动会自动创建数据库表和默认管理员账号。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前后端开发服务器（推荐） |
| `npm run dev:server` | 仅启动后端（NestJS watch模式） |
| `npm run dev:client` | 仅启动前端（Vite） |
| `npm run build` | 构建生产版本（前后端） |
| `npm run build:server` | 仅构建后端 |
| `npm run build:client` | 仅构建前端 |
| `npm run start` | 启动生产构建 |
| `npm run type:check` | 前后端类型检查 |

## API 概览

所有接口前缀 `/api`，写操作需在 Header 中携带 JWT：

```
Authorization: Bearer <token>
```

### 认证
- `POST /api/auth/login` — 登录获取 token

### 产品
- `GET /api/products` — 产品列表（搜索、分类筛选、分页）
- `GET /api/products/:id` — 产品详情
- `POST /api/products` — 新增产品（需登录）
- `PUT /api/products/:id` — 更新产品（需登录）
- `DELETE /api/products/:id` — 删除产品（需登录）
- `POST /api/products/:id/featured` — 切换推荐（需登录）
- `DELETE /api/products/batch` — 批量删除（需登录）

### 分类
- `GET /api/categories` — 分类列表
- `POST /api/categories` — 新增分类（需登录）
- `PUT /api/categories/:id` — 更新分类（需登录）
- `DELETE /api/categories/:id` — 删除分类（需登录）

### 博客
- `GET /api/blog-posts` — 博客列表
- `GET /api/blog-posts/:id` — 博客详情
- `POST /api/blog-posts` — 新增博客（需登录）
- `PUT /api/blog-posts/:id` — 更新博客（需登录）
- `DELETE /api/blog-posts/:id` — 删除博客（需登录）

### 询盘
- `GET /api/inquiries` — 询盘列表（状态筛选、搜索、分页）
- `GET /api/inquiries/:id` — 询盘详情
- `PUT /api/inquiries/:id/status` — 更新状态（需登录）
- `DELETE /api/inquiries/:id` — 删除询盘（需登录）

### 客户管理 CRM
- `GET /api/customers` — 客户列表（搜索、状态筛选、优先级、分页）
- `GET /api/customers/stats` — 客户统计
- `GET /api/customers/:id` — 客户详情（含跟进记录）
- `POST /api/customers` — 新增客户（需登录）
- `PUT /api/customers/:id` — 更新客户（需登录）
- `DELETE /api/customers/:id` — 删除客户（需登录）
- `POST /api/customers/from-inquiry` — 从询盘转客户（需登录）
- `POST /api/customers/:id/followups` — 添加跟进记录（需登录）
- `DELETE /api/customers/followups/:id` — 删除跟进记录（需登录）
- `PUT /api/customers/followups/:id/toggle-replied` — 切换已回复（需登录）

### 数据导出
- `POST /api/export/sync-to-frontend` — 同步数据到前台项目（需登录）

### 文件上传
- `POST /api/upload` — 上传图片（需登录，返回 URL）

## 数据库

### 表结构

| 表名 | 说明 |
|------|------|
| `admin` | 管理员账号 |
| `category` | 产品分类 |
| `product` | 产品 |
| `blog_post` | 博客文章 |
| `inquiry` | 询盘 |
| `customer` | 客户（CRM） |
| `customer_followup` | 客户跟进记录 |

### 数据库文件

SQLite 数据库文件位于 `./data/app.db`，首次启动自动创建。如需重置数据，删除该文件后重启即可。

## 与前台项目同步

本后台与前台玩具网站（`toy-website`）配合使用：

1. 在后台 `.env` 中配置 `FRONTEND_DATA_DIR` 指向前台的 `src/data` 目录
2. 配置 `FRONTEND_UPLOAD_DIR` 指向前台的 `public/images/uploads` 目录
3. 在后台「系统设置」页面点击「同步到前台」
4. 后台会将产品/分类/博客数据写入前台 JSON 文件，并复制上传的图片
5. 前台项目刷新即可看到更新

前台数据文件：
- `src/data/products.json`
- `src/data/categories.json`
- `src/data/blog.json`

## 部署

### 本地构建

```bash
npm run build
npm run start
```

### Vercel / 其他平台

后端使用 NestJS，可部署到任何支持 Node.js 的平台。前端构建产物在 `dist/client/`，可部署到静态托管服务。

建议使用 PM2 管理后端进程：

```bash
npm install -g pm2
pm2 start dist/server/main.js --name toy-admin
pm2 save
pm2 startup
```

### Nginx 反向代理示例

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    # 前端静态文件
    root /var/www/toy-admin/dist/client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://localhost:3000;
    }
}
```

## 开发说明

### 新增 API 接口

1. 在 `server/modules/` 下创建或修改模块（controller + service + module）
2. 在 `server/app.module.ts` 中注册模块
3. 在 `client/src/api/` 下创建对应的 API 客户端
4. 在 `shared/api.interface.ts` 中定义共享类型

### 新增数据库表

1. 在 `server/database/sqlite-schema.ts` 中添加表定义
2. 在 `server/database/migrate.ts` 中添加 `CREATE TABLE IF NOT EXISTS` SQL
3. 重启服务自动建表

### 客户编号规则

格式：`C` + 4位年份 + 6位序号，例如 `C2026000001`。每年从 000001 重新计数，创建客户时自动生成。

## 常见问题

### Q: npm install 报错 better-sqlite3 编译失败？
A: 确保 Node 版本为 18.x 或 20.x，不要用 22+。项目已锁定 better-sqlite3@^11.7.0，使用预编译二进制，无需 Python。

### Q: 启动后端口被占用？
A: 修改 `dev.js` 中的端口配置，或杀死占用进程：`taskkill /F /IM node.exe`（Windows）。

### Q: 忘记管理员密码？
A: 删除 `./data/app.db` 后重启，会重新创建默认账号 admin/admin123。

### Q: 前台看不到后台更新的产品？
A: 检查 `.env` 中 `FRONTEND_DATA_DIR` 路径是否正确，然后在「系统设置」页面点击同步。

## License

Private
