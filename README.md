# Toy Admin Dashboard — 玩具B2B后台管理系统

国际B2B玩具采购网站配套的后台管理系统，支持产品管理、分类管理、博客管理、询盘管理、客户管理CRM、单证生成、AI获客、地图采集、短视频营销等功能。

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
| 浏览器自动化 | Playwright（地图采集） |
| 语言 | TypeScript（严格模式） |

## 功能模块

### 仪表盘 Dashboard
- 核心数据统计（产品数、分类数、博客数、询盘数、客户数）
- 最近询盘列表
- 数据趋势图表

### 产品管理 Products
- 产品 CRUD（增删改查）
- 产品图片上传、多图相册
- 产品规格、MOQ、包装信息、交期
- 推荐产品切换
- 批量删除
- **批量Excel导入**（下载模板，填写后上传识别）

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

### 单证工具 Documents
- 支持 **报价单 Quotation**、**PI 形式发票**、**CI 商业发票**、**PL 装箱单** 四种单证
- 单证信息、卖方信息、条款自动缓存，无需重复填写
- 产品可从产品管理库直接选择导入
- 支持上传公司印章和手写签名，自动覆盖在签名处
- 银行账户信息、付款条款（Deposit 30% / Balance 70%）、Amount in Words
- 装箱单自动计算 Total Cartons、Total Net Weight、Total Gross Weight、Total Volume
- 打印样式优化（A4尺寸、纯白背景、无边框阴影）
- 单证列表管理、编辑、删除

### AI 获客 AI Lead
- AI 自动获客：输入产品名称、关键词、目标国家、客户类型，自动生成潜在客户
- AI 客户背调：输入公司名或网站，生成完整客户情报报告
- AI 自主开发：根据客户信息个性化生成开发信（Cold Email / LinkedIn / WhatsApp）
- 邮箱管理中心：连接 Gmail/Outlook/SMTP，AI 识别回复分类并生成建议回复

### 地图采集 Maps Scraper
- 基于 **Playwright** 真实采集 Google Maps 商家数据
- 支持按国家、州/省、城市、关键词采集
- 关键词下拉框（32个玩具行业选项）+ 自定义输入
- 采集字段：公司名、地址、城市、电话、WhatsApp、邮箱、网站、评分、评论数
- 实时进度条、运行日志、采集结果表格
- 批量选择、批量添加到客户管理
- 导出 Excel（带样式）
- 采集预设保存与加载
- WhatsApp 与电话重复时自动隐藏
- 邮箱自动过滤无效内容（图片扩展名等）

### 短视频营销 Video Marketing
- 对接 **MoneyPrinterTurbo** AI 视频生成服务
- **无需 LLM API Key**：未填写自定义脚本时自动根据主题生成默认脚本，跳过 LLM 调用
- 画幅选择：9:16 竖屏（TikTok/Shorts）、16:9 横屏（YouTube）、1:1 方形
- 8种多语言 AI 配音（英/西/法/德/日/阿，Edge TTS 免费）
- 自动字幕、背景音乐开关
- 任务列表：视频预览、状态、进度条、运行日志
- 自动轮询生成状态，失败任务支持重试
- 素材来源：Pexels（需配置免费 API Key）

### 数据导出 Export
- 一键同步产品/分类/博客数据到前台项目 `src/data/` 目录
- 自动复制上传图片到前台 `public/images/uploads/`
- 前台刷新即可看到更新

### 系统设置 Settings
- 前台数据目录配置
- 一键同步到前台
- 数据导出（产品/分类/博客 Excel）

## 项目结构

```
.
├── client/                    # 前端 React 应用
│   ├── src/
│   │   ├── api/              # API 客户端
│   │   ├── components/       # 通用组件 + 布局 + UI组件
│   │   ├── pages/            # 页面组件
│   │   │   ├── Dashboard/
│   │   │   ├── Products/
│   │   │   ├── Categories/
│   │   │   ├── Blog/
│   │   │   ├── Inquiries/
│   │   │   ├── Customers/    # 客户管理CRM
│   │   │   ├── Documents/    # 单证工具
│   │   │   ├── AiLead/       # AI获客
│   │   │   ├── AiIntelligence/ # AI背调
│   │   │   ├── AiOutreach/   # AI开发
│   │   │   ├── EmailCenter/  # 邮箱中心
│   │   │   ├── MapsScraper/  # 地图采集
│   │   │   ├── VideoMarketing/ # 短视频营销
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
│   │   ├── document/         # 单证工具
│   │   ├── ai/               # AI获客四模块
│   │   ├── maps-scraper/     # 地图采集（Playwright）
│   │   ├── video-marketing/  # 短视频营销（MPT对接）
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
- **Playwright Chromium**（地图采集功能需要，运行 `npx playwright install chromium`）
- **MoneyPrinterTurbo**（短视频营销功能需要，可选）

> ⚠️ 不要使用 Node 22+，better-sqlite3@11 在 Node 20 下稳定运行。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装 Playwright 浏览器（地图采集功能需要）

```bash
npx playwright install chromium
```

### 3. 配置环境变量

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

# MoneyPrinterTurbo API 地址（短视频营销功能，可选）
MPT_API_URL=http://127.0.0.1:8081
```

### 4. 启动开发服务器

```bash
# 方式一：通过 npm（推荐）
npm run dev

# 方式二：直接运行启动脚本
node dev.js
```

`dev.js` 会同时启动后端（NestJS，端口 3000）和前端（Vite，端口 8080）。

启动后：
- 前端管理后台：http://localhost:8080
- 后端 API：http://localhost:3000

### 5. 默认账号

```
用户名：admin
密码：admin123
```

首次启动会自动创建数据库表和默认管理员账号。

## MoneyPrinterTurbo 安装（短视频营销）

短视频营销功能需要单独部署 MoneyPrinterTurbo 服务。

### 1. 安装 Python 3.11

从 https://www.python.org/downloads/release/python-3119/ 下载 **Windows installer (64-bit)**，安装时勾选 **Add Python to PATH**。

> ⚠️ 必须下载 .exe 安装包，不要下载源码包（含 configure/Makefile 的是 Linux 用的）。

### 2. 克隆并安装依赖

```bash
git clone https://github.com/harry0703/MoneyPrinterTurbo.git
cd MoneyPrinterTurbo
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. 修改配置文件

编辑 `MoneyPrinterTurbo/config.toml`：

```toml
# 端口改为 8081，避免与后台前端 8080 冲突
listen_port = 8081

# 日志级别改为 INFO，能看到启动信息
log_level = "INFO"

# Pexels API Key（必须配置，用于下载视频素材）
# 免费申请：https://www.pexels.com/api/
pexels_api_keys = ["你的pexels_api_key"]
```

> ⚠️ Pexels API Key 是必须的，否则视频生成会失败（`pexels_api_keys is not set`）。申请时 Project Description 至少 50 字符，可参考：
> "This API key is used in an internal toy business admin dashboard to generate short marketing videos. MoneyPrinterTurbo searches Pexels for stock footage based on product keywords such as bubble toys, remote control cars, building blocks, and beach toys."

### 4. 修复 asgi.py（避免 WebSocket 断言错误）

MPT 原版 `app/asgi.py` 末尾把 StaticFiles 挂载在根路径 `/`，会导致 WebSocket 请求触发 `assert scope["type"] == "http"` 错误。需要注释掉根路径挂载：

```python
# 文件：app/asgi.py 末尾
task_dir = utils.task_dir()
app.mount("/tasks", StaticFiles(directory=task_dir, html=True), name="tasks")

# 注释掉下面这两行（根路径 StaticFiles 挂载）
# public_dir = utils.public_dir()
# app.mount("/", StaticFiles(directory=public_dir, html=True), name="")
```

### 5. 启动 API 服务

```bash
cd MoneyPrinterTurbo
.venv\Scripts\activate
python main.py
```

看到 `Uvicorn running on http://0.0.0.0:8081` 即启动成功。

> 注意：必须先激活虚拟环境（`.venv\Scripts\activate`），否则会报 `No module named 'uvicorn'`。也可以直接用 `.venv\Scripts\python.exe main.py` 跳过激活步骤。

### 6. 无需 LLM API Key

本系统已优化：创建视频时如果用户未填写自定义脚本，后端会自动根据主题生成默认脚本并提取素材关键词，**完全跳过 MPT 的 LLM 调用**，因此不需要配置 moonshot/openai 等 LLM API Key。只需：
- Edge TTS（免费，自动使用）
- Pexels API Key（免费，需手动申请配置）

### 7. 验证连接

启动后访问 http://127.0.0.1:8081/ping ，返回 `"pong"` 即正常。后台短视频营销页面会显示「MPT 服务已连接」。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前后端开发服务器（等同于 `node dev.js`，推荐） |
| `node dev.js` | 直接运行启动脚本，前后端并发启动 |
| `npm run dev:server` | 仅启动后端（NestJS watch模式） |
| `npm run dev:client` | 仅启动前端（Vite） |
| `npm run build` | 构建生产版本（前后端） |
| `npm run build:server` | 仅构建后端 |
| `npm run build:client` | 仅构建前端 |
| `npm run start` | 启动生产构建 |
| `npm run type:check` | 前后端类型检查 |
| `npx playwright install chromium` | 安装 Playwright 浏览器 |

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
- `POST /api/products/import` — 批量Excel导入（需登录）

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

### 单证工具
- `GET /api/documents` — 单证列表
- `GET /api/documents/:id` — 单证详情
- `POST /api/documents` — 新创单证（需登录）
- `PUT /api/documents/:id` — 更新单证（需登录）
- `DELETE /api/documents/:id` — 删除单证（需登录）

### 地图采集
- `GET /api/maps-scraper/tasks` — 采集任务列表
- `GET /api/maps-scraper/tasks/:id` — 任务详情
- `POST /api/maps-scraper/tasks` — 创建采集任务（需登录）
- `POST /api/maps-scraper/tasks/:id/start` — 开始采集（需登录）
- `POST /api/maps-scraper/tasks/:id/stop` — 停止采集（需登录）
- `GET /api/maps-scraper/tasks/:id/results` — 采集结果
- `POST /api/maps-scraper/results/:id/add-to-customer` — 转客户（需登录）
- `GET /api/maps-scraper/presets` — 预设列表
- `POST /api/maps-scraper/presets` — 保存预设（需登录）

### 短视频营销
- `GET /api/video-marketing/tasks` — 视频任务列表
- `GET /api/video-marketing/tasks/:id` — 任务详情
- `POST /api/video-marketing/tasks` — 创建视频任务（需登录）
- `POST /api/video-marketing/tasks/:id/refresh` — 刷新状态/重试（需登录）
- `DELETE /api/video-marketing/tasks/:id` — 删除任务（需登录）
- `GET /api/video-marketing/service/status` — MPT 服务状态检测

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
| `document` | 单证 |
| `ai_lead` | AI获客线索 |
| `ai_intelligence_report` | AI背调报告 |
| `ai_outreach` | AI开发记录 |
| `email_account` | 邮箱账号 |
| `email_message` | 邮件消息 |
| `maps_scraper_task` | 地图采集任务 |
| `maps_scraper_result` | 地图采集结果 |
| `maps_scraper_preset` | 地图采集预设 |
| `video_task` | 短视频任务 |

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

### 侧边栏菜单分组

侧边栏菜单分为 7 组可折叠目录：工作台、产品中心、内容管理、业务管理、单证工具、AI获客、系统。在 `client/src/components/Layout.tsx` 的 `NAV_GROUPS` 中配置。

## 常见问题

### Q: npm install 报错 better-sqlite3 编译失败？
A: 确保 Node 版本为 18.x 或 20.x，不要用 22+。项目已锁定 better-sqlite3@^11.7.0，使用预编译二进制，无需 Python。

### Q: 启动后端口被占用？
A: 修改 `dev.js` 中的端口配置，或杀死占用进程：`taskkill /F /IM node.exe`（Windows）。

### Q: 忘记管理员密码？
A: 删除 `./data/app.db` 后重启，会重新创建默认账号 admin/admin123。

### Q: 前台看不到后台更新的产品？
A: 检查 `.env` 中 `FRONTEND_DATA_DIR` 路径是否正确，然后在「系统设置」页面点击同步。

### Q: 地图采集报错 "Executable doesn't exist"？
A: Playwright 浏览器未安装，运行 `npx playwright install chromium`。

### Q: 短视频营销提示 MPT 服务未连接？
A: 需要单独启动 MoneyPrinterTurbo 服务，参考上方「MoneyPrinterTurbo 安装」章节。确保 `.env` 中 `MPT_API_URL=http://127.0.0.1:8081`。

### Q: 视频生成失败，提示 `moonshot: api_key is not set`？
A: 已修复。后端会自动生成默认脚本跳过 LLM 调用。请重启后台（`npm run dev`），删除失败任务后重新创建。

### Q: 视频生成失败，提示 `pexels_api_keys is not set`？
A: 需要在 MPT 的 `config.toml` 中配置 Pexels API Key。免费申请：https://www.pexels.com/api/ ，配置后重启 MPT。

### Q: MPT 启动报错 `assert scope["type"] == "http"`？
A: MPT 原版 asgi.py 根路径 StaticFiles 挂载导致 WebSocket 断言错误。参考「MoneyPrinterTurbo 安装」第4步，注释掉根路径挂载。

### Q: MPT 启动报错 `No module named 'uvicorn'`？
A: 没有激活虚拟环境。先运行 `.venv\Scripts\activate`，再运行 `python main.py`；或直接用 `.venv\Scripts\python.exe main.py`。

### Q: 地图采集结果中邮箱显示 jpg 等无效内容？
A: 已在后端自动过滤图片/文档扩展名，升级到最新版本即可。

## License

Private
