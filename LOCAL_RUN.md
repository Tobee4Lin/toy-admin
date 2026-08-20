# 本地独立运行指南

本项目已改造为可在本地独立运行的版本，无需任何飞书/豆包平台账号或 SDK。

## 环境要求

- Node.js >= 22.0.0
- npm >= 10.0.0
- Windows / macOS / Linux 均可

## 快速启动

```bash
# 安装依赖
npm install

# 启动开发环境（后端 + 前端同时启动）
node dev.js
```

启动后：
- **后端 API**：http://localhost:3000
- **前端管理界面**：http://localhost:8080
- **默认管理员**：admin / admin123

## 端口配置

如需修改端口，设置环境变量：

```bash
# Windows PowerShell
$env:SERVER_PORT="3001"
$env:CLIENT_PORT="8081"
node dev.js

# Linux/macOS
SERVER_PORT=3001 CLIENT_PORT=8081 node dev.js
```

## 数据库

- 类型：SQLite (better-sqlite3)
- 数据库文件：`./data/app.db`
- 首次运行自动创建表结构和种子数据
- 删除 `data/` 目录可重置数据库

### 种子数据

- 管理员：admin / admin123
- 4 个默认分类
- 3 个示例产品
- 2 篇博客文章
- 2 条示例询盘

## 前台网站对接

前台网站可通过以下配置调用本后端 API：

```
VITE_API_BASE_URL=http://localhost:3000
```

公开接口（无需鉴权）：
- `POST /api/public/inquiries` — 提交询盘
- `POST /api/public/leads` — 提交目录下载线索

CORS 已开启，允许任何来源跨域调用。

## 功能清单

- [x] JWT 登录认证
- [x] 仪表盘统计
- [x] 产品管理（CRUD + 精选切换 + 批量删除）
- [x] 分类管理（CRUD）
- [x] 博客管理（CRUD）
- [x] 询盘管理（列表、详情、状态更新、删除）
- [x] 公开询盘/线索提交接口
- [x] 数据导出（products.json / categories.json / blog.json）
- [x] CORS 支持

## 构建生产版本

```bash
# 构建后端
npx nest build --path tsconfig.node.local.json

# 构建前端
npx vite build --config vite.local.config.ts

# 启动
node dist/server/bootstrap.js
```

## 项目结构

```
server/
  bootstrap.ts          # 独立启动入口（推荐使用）
  app.module.ts         # 应用根模块
  database/
    db.ts               # SQLite 数据库连接
    sqlite-schema.ts    # SQLite schema 定义
    migrate.ts          # 建表 + 种子数据
  modules/
    auth/               # JWT 认证模块
    database/           # 数据库全局模块
    product/            # 产品管理
    category/           # 分类管理
    blog-post/          # 博客管理
    inquiry/            # 询盘管理
    dashboard/          # 仪表盘
    export/             # 数据导出
client/                 # 前端 React 应用
data/                   # SQLite 数据库文件（自动创建）
dev.js                  # 开发启动脚本
vite.local.config.ts    # Vite 配置（本地版）
tsconfig.node.local.json # 后端 TS 配置（本地版）
tsconfig.app.local.json  # 前端 TS 配置（本地版）
```
