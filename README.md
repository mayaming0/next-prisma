# Golden Blog

一个基于 Next.js + Prisma 的全栈博客系统，用于学习笔记和技术分享。

## ✨ 功能特性

### 核心功能
- **文章管理** - 支持 Markdown 语法、实时预览、标签分类
- **用户认证** - NextAuth 5.x 实现的登录/注册系统，支持邀请码注册
- **角色权限** - ADMIN/USER 角色分离，管理员可管理用户和文章
- **文件上传** - 支持上传 .md 文件快速创建文章

### 技术亮点
- **React Server Components** - 服务端渲染提升性能
- **Edge Runtime** - 中间件运行在边缘计算环境
- **PostgreSQL + Prisma** - 现代化数据库管理
- **Tailwind CSS 4** - 原子化 CSS 样式方案
- **完整测试体系** - API 路由测试、组件测试、数据库测试

## 🛠 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 16.2.10 |
| UI 库 | React | 19.2.4 |
| 数据库 | PostgreSQL | - |
| ORM | Prisma | 7.8.0 |
| 认证 | NextAuth | 5.0.0-beta.31 |
| 样式 | Tailwind CSS | 4.x |
| 测试 | Vitest | 4.1.9 |
| 代码检查 | ESLint | 9.x |

## 📋 环境要求

- Node.js >= 20.x
- PostgreSQL >= 15.x
- npm >= 11.x

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd next-prisma
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

创建 PostgreSQL 数据库：

```sql
CREATE DATABASE golden_blog;
CREATE DATABASE golden_blog_test;
```

复制 `.env.example` 并修改数据库连接：

```bash
cp .env.example .env
```

修改 `.env` 文件：

```env
# 主数据库
DATABASE_URL="postgresql://username:password@localhost:5432/golden_blog?schema=public"

# 测试数据库
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/golden_blog_test?schema=public"

# NextAuth 密钥（生产环境请使用安全的随机字符串）
NEXTAUTH_SECRET="your-secret-key-here"

# 注册邀请码
INVITATION_CODE="F2Z4Q6"
```

### 4. 数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate

# 初始化测试数据
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 🔐 默认账号

数据库初始化后会创建以下账号：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| Dragon Fu | password123 | ADMIN |
| Lina Wang | password123 | ADMIN |
| Mike Chen | password123 | USER |
| Sarah Liu | password123 | USER |
| Jack Zhang | password123 | USER |

## 📁 项目结构

```
next-prisma/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 认证页面（登录/注册）
│   ├── (dashboard)/        # 仪表盘页面（文章/用户管理）
│   ├── api/                # API 路由
│   │   ├── articles/       # 文章 CRUD
│   │   ├── auth/           # 认证相关
│   │   └── users/          # 用户管理
│   └── layout.tsx          # 根布局
├── components/             # React 组件
│   ├── admin/              # 管理后台组件
│   ├── articles/           # 文章相关组件
│   ├── editor/             # Markdown 编辑器
│   ├── layout/             # 布局组件
│   ├── providers/          # 全局 Provider
│   └── ui/                 # 基础 UI 组件
├── lib/                    # 工具库
│   ├── auth.ts             # NextAuth 配置
│   ├── auth.config.ts      # 认证配置（不含 DB 依赖）
│   ├── credentials.ts      # Credentials Provider
│   ├── db.ts               # Prisma Client 实例
│   ├── invitation.ts       # 邀请码校验
│   └── types.ts            # TypeScript 类型定义
├── prisma/                 # Prisma ORM
│   ├── schema.prisma       # 数据库模型
│   └── seed.ts             # 测试数据
├── tests/                  # 测试文件
│   ├── api/                # API 路由测试
│   ├── components/         # 组件测试
│   ├── helpers/            # 测试辅助工具
│   └── lib/                # 业务逻辑测试
└── middleware.ts           # Next.js 中间件（权限控制）
```

## 🔌 API 路由

### 认证
| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册（需邀请码） |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth 认证端点 |

### 文章
| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/articles` | 获取文章列表 |
| POST | `/api/articles` | 创建文章（ADMIN） |
| GET | `/api/articles/:id` | 获取单篇文章 |
| PUT | `/api/articles/:id` | 更新文章（ADMIN） |
| DELETE | `/api/articles/:id` | 删除文章（ADMIN） |

### 用户
| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取用户列表（ADMIN） |
| DELETE | `/api/users/:id` | 删除用户（ADMIN） |

## 🧪 测试

```bash
# 运行所有测试
npm run test:run

# 监听模式运行测试
npm run test

# 运行特定测试文件
npm run test:run -- articles.test.ts
```

测试覆盖三大类：
- **API 路由测试** - 验证后端接口功能
- **组件测试** - 验证 UI 组件渲染和交互
- **数据库测试** - 验证 Prisma 操作和业务逻辑

## 📝 开发规范

### 代码风格
- 使用 ESLint 进行代码检查：`npm run lint`
- TypeScript 严格模式：`strict: true`
- 组件命名：PascalCase
- 文件命名：kebab-case

### 提交规范
使用 Conventional Commits：
- `feat:` - 新功能
- `fix:` - 修复 bug
- `docs:` - 文档更新
- `refactor:` - 代码重构

## 🚀 部署

### 构建

```bash
npm run build
```

### 生产环境启动

```bash
npm run start
```

### 推荐部署平台
- Vercel（官方推荐）
- Railway（数据库集成友好）
- AWS EC2 / ECS

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
