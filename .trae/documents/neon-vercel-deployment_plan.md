# Neon + Vercel 部署方案

## 一、现状分析

### 项目配置检查
- **Next.js 版本**: 16.2.10（App Router）
- **Prisma 版本**: 7.8.0
- **数据库**: PostgreSQL（本地）
- **认证**: NextAuth 5.0.0-beta.31
- **next.config.ts**: 空配置，未指定输出模式
- **prisma.config.ts**: 使用 `DATABASE_URL` 环境变量连接数据库
- **.gitignore**: 已忽略 `.env*` 和 `.vercel`

### 需要调整的配置
1. Prisma 生成配置 — 确保 Vercel 构建时正确生成 Prisma Client
2. Next.js 构建命令 — 需在构建前执行 prisma generate
3. 环境变量 — 配置 Neon 数据库连接串和 NextAuth 密钥
4. NEXTAUTH_URL — Vercel 部署后需要配置正确的 URL
5. 中间件 Edge Runtime — 确认 Vercel 兼容

---

## 二、部署步骤

### 第一阶段：Neon 数据库准备

**目标**：创建 Neon 数据库并获取连接串

**步骤**：
1. 注册/登录 [Neon.tech](https://neon.tech)
2. 创建新项目
   - Project name: `golden-blog`
   - Region: 选择离用户最近的区域（推荐 `Southeast Asia (Singapore)` 或 `West US (Oregon)`）
   - Database name: `neondb`（默认即可）
3. 获取连接串
   - 进入 Dashboard → Connection String
   - 复制 PostgreSQL 连接串（格式：`postgresql://user:password@host/dbname?sslmode=require`）
   - 注意：Neon 连接串必须带 `?sslmode=require` 参数

### 第二阶段：本地配置验证

**目标**：确保代码能正确连接 Neon 数据库

**步骤**：
1. 本地测试 Neon 连接
   - 临时修改本地 `.env` 中的 `DATABASE_URL` 为 Neon 连接串
   - 执行 `npx prisma db push` 推送 schema
   - 执行 `npm run db:seed` 初始化数据
   - 启动 `npm run dev` 验证功能正常
2. 恢复本地 `.env` 为本地数据库

### 第三阶段：代码配置调整

**目标**：确保代码兼容 Vercel 部署环境

**需修改文件**：

1. **package.json** — 确保构建脚本正确
   - 检查 `build` 脚本是否需要添加 `prisma generate`
   - Prisma 7.x 通常会自动处理，但建议显式配置

2. **next.config.ts** — 可选优化
   - 添加 `output: 'standalone'`（非必须，Vercel 默认优化）
   - 配置 `images.remotePatterns`（如果有外部图片）

3. **可选：添加 vercel.json**
   - 如果需要自定义重写/重定向规则
   - 当前项目使用 App Router，通常不需要

### 第四阶段：Vercel 部署

**目标**：将项目部署到 Vercel

**步骤**：
1. 推送代码到 GitHub 仓库（如果还没有）
2. 登录 [vercel.com](https://vercel.com)
3. 导入 GitHub 项目
   - New Project → Import Git Repository
   - 选择你的 `next-prisma` 仓库
4. 配置环境变量（Build & Development Settings → Environment Variables）：
   - `DATABASE_URL` = Neon 连接串（含 `?sslmode=require`）
   - `NEXTAUTH_SECRET` = 随机密钥（可用 `openssl rand -base64 32` 生成）
   - `NEXTAUTH_URL` = Vercel 项目 URL（部署后自动生成，可先填占位符）
   - `INVITATION_CODE` = 注册邀请码
5. 点击 Deploy，等待构建完成

### 第五阶段：部署后验证

**目标**：确认部署成功，功能正常

**检查项**：
1. 构建日志 — 确认 Prisma Client 生成成功
2. 首页访问 — 确认页面正常渲染
3. 登录功能 — 使用 Dragon Fu / password123 登录
4. API 测试 — 访问 `/api/articles` 确认数据正确
5. 权限控制 — 验证 ADMIN 菜单和功能
6. Session 持久化 — 刷新页面确认登录状态保持

---

## 三、环境变量清单

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | Neon 数据库连接串，必须带 sslmode | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXTAUTH_SECRET` | NextAuth 签名密钥 | `openssl rand -base64 32` 生成 |
| `NEXTAUTH_URL` | 应用完整 URL（Vercel 自动设置） | `https://your-project.vercel.app` |
| `INVITATION_CODE` | 注册邀请码 | 自定义（如 `F2Z4Q6`） |

---

## 四、注意事项与风险处理

### 1. Prisma Client 生成
- **风险**: Vercel 构建时未自动生成 Prisma Client
- **处理**: 
  - Prisma 7.x 配合 Next.js 插件通常自动处理
  - 如果失败，在 `package.json` 的 `build` 脚本中添加 `prisma generate`
  - 或使用 `@prisma/adapter-pg`（项目已安装）+ `pg` 连接池

### 2. Neon 连接池
- **风险**: 无服务器环境连接数过多耗尽数据库连接
- **处理**: 
  - Neon 自带连接池（Prisma 7.x 已优化）
  - 项目已使用 `@prisma/adapter-pg` + `pg.Pool`，天然支持连接池
  - 生产环境可考虑 Neon 的 pooled connection string

### 3. NextAuth 回调 URL
- **风险**: 部署后登录回调跳转到 localhost
- **处理**: 
  - Vercel 自动设置 `VERCEL_URL` 环境变量
  - NextAuth 5.x 会自动读取
  - 确保配置了正确的 `NEXTAUTH_URL`

### 4. 数据库迁移
- **风险**: 部署后数据库 schema 不匹配
- **处理**: 
  - 首次部署前手动执行 `prisma migrate deploy`
  - 或配置 Vercel Build Command 为 `prisma migrate deploy && next build`
  - 建议生产环境使用迁移而非 `db push`

### 5. Edge Runtime 兼容性
- **风险**: middleware 在 Vercel Edge 运行时异常
- **处理**: 
  - 当前 middleware 已避免导入 Prisma，使用独立 authConfig
  - 已通过 Edge Runtime 验证（前面修复的 node:path 问题）

---

## 五、可选优化

### 1. 自定义域名
- 在 Vercel Project → Settings → Domains 添加自定义域名
- 同时在 Neon 中更新 IP 白名单（如果开启了）

### 2. 预览环境
- Vercel 自动为每个 PR 创建预览环境
- 可以配置 Neon 的分支数据库功能，为预览环境创建独立数据库

### 3. 性能优化
- 开启 Vercel Edge Cache
- 配置 ISR（Incremental Static Regeneration）缓存文章页面

### 4. 监控
- Vercel Analytics — 页面性能监控
- Neon Dashboard — 数据库查询监控
