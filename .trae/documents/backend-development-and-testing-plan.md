# 后端开发与测试完整计划

> 目标：修复 Prisma 7 数据库连接阻塞问题，完成剩余后端验证，并补齐三类测试（API 路由 / 组件 / 业务逻辑）。

---

## 一、当前状态分析

### ✅ 已完成且可工作
- **Prisma schema** (`prisma/schema.prisma`) 与 **CLI 配置** (`prisma.config.ts`) 已按 Prisma 7 规范配置（新 `prisma-client` generator，URL 走 `prisma.config.ts`）
- **生成的 Prisma Client** 位于 `app/generated/prisma/`，包含 User/Article 模型、枚举、内部命名空间
- **`.env`** 含 `DATABASE_URL` 和 `INVITATION_CODE="F2Z4Q6"`
- **6 个 API 路由** 已实现，统一通过 `auth()` 做会话与角色校验：
  - `app/api/articles/route.ts` — GET 列表（含搜索）/ POST 创建（ADMIN）
  - `app/api/articles/[id]/route.ts` — GET / PUT（ADMIN）/ DELETE（ADMIN）
  - `app/api/users/route.ts` — GET 列表（ADMIN）
  - `app/api/users/[id]/route.ts` — DELETE 删除（ADMIN，禁自删）
  - `app/api/auth/register/route.ts` — POST 注册（邀请码 + bcrypt）
  - `app/api/auth/[...nextauth]/route.ts` — NextAuth v5 handlers
- **认证体系**：NextAuth v5 + Credentials Provider + bcrypt + JWT（注入 role/id）+ middleware 路由保护
- **前端页面** 已全部接入真实 API（无 mock 数据）
- **测试脚手架** 已就绪：`tests/helpers/test-db.ts`、`tests/helpers/mock-request.ts`、`tests/setup.ts`
- **Vitest 配置** 已存在，含 `@` 别名与 jsdom-for-components 策略

### ❌ 阻塞问题（必须先修）
1. **`lib/db.ts`、`prisma/seed.ts`、`tests/helpers/test-db.ts`** 三处都用了 Prisma 7 已废弃的 `datasourceUrl` 选项构造 `PrismaClient`，运行时会抛 `Unknown property datasourceUrl`
2. **`@prisma/adapter-pg` 与 `pg` 包未安装** — 必须先装包才能用 adapter 模式
3. **`vitest.config.ts` 的 `setupFiles: []` 为空** — 已存在的 `tests/setup.ts`（jest-dom matchers）未被加载，组件测试会因 `toBeInTheDocument` 等断言失败

### 🆕 完全缺失
- 所有测试文件（`tests/**/*.test.ts` / `*.test.tsx` 均不存在）
- 独立测试数据库 `mydb_test` 及其连接配置
- Prisma driver adapter 依赖

---

## 二、关键决策（已与用户确认）

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 测试数据库策略 | **独立测试数据库** | 新建 `mydb_test`，加 `TEST_DATABASE_URL` 到 `.env`；测试前 `prisma db push` 同步表结构，每个测试 `beforeEach` 清空表。开发数据零影响。 |
| NextAuth Session mock 方式 | **`vi.mock('next-auth/react')`** | 组件测试中直接 mock `useSession` 返回值，灵活验证不同角色下的渲染逻辑。 |
| 文章详情页 | **保持现状**（Server Component 直查 Prisma） | 已工作，不在本计划范围内改动。 |

---

## 三、实施阶段

### 阶段 A：修复 Prisma 7 Client 构造（阻塞修复）

**目标**：让所有数据库访问层恢复可用。

1. **安装依赖**
   ```bash
   npm install @prisma/adapter-pg pg
   npm install -D @types/pg
   ```

2. **重构 `lib/db.ts`**（生产连接，单例）
   - 删除 `datasourceUrl` 选项
   - 引入 `PrismaPg` adapter + `pg` `Pool`
   - 保留全局单例模式与 `log: ['error']`
   ```ts
   import { PrismaClient } from '@/app/generated/prisma/client';
   import { PrismaPg } from '@prisma/adapter-pg';
   import { Pool } from 'pg';

   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

   function createPrismaClient() {
     const pool = new Pool({ connectionString: process.env.DATABASE_URL });
     const adapter = new PrismaPg(pool);
     return new PrismaClient({ adapter, log: ['error'] });
   }

   export const prisma = globalForPrisma.prisma ?? createPrismaClient();
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
   ```

3. **重构 `prisma/seed.ts`** — 同样改为 adapter 模式（独立 Pool，结尾关闭）

4. **重构 `tests/helpers/test-db.ts`** — 改为读取 `TEST_DATABASE_URL`，用 adapter 模式，导出 `prisma`、`cleanDatabase`、`createTestUser`、`createTestArticle`、`disconnect`

---

### 阶段 B：测试数据库与配置

**目标**：建立隔离的测试环境。

1. **创建测试数据库**（手动执行一次）
   ```bash
   # 用 psql 或 pgAdmin 创建空数据库 mydb_test
   createdb -U postgres mydb_test
   ```
   若 `createdb` 不可用，则用 SQL：`CREATE DATABASE mydb_test;`

2. **同步测试库表结构**
   ```bash
   # 临时把 DATABASE_URL 指向 mydb_test 后执行
   DATABASE_URL="postgresql://postgres:Pg123456@localhost:5432/mydb_test?schema=public" npx prisma db push
   ```
   或在 `package.json` 加脚本：`"db:push:test": "cross-env DATABASE_URL=postgresql://postgres:Pg123456@localhost:5432/mydb_test?schema=public prisma db push"`

3. **更新 `.env`** 增加：
   ```
   TEST_DATABASE_URL="postgresql://postgres:Pg123456@localhost:5432/mydb_test?schema=public"
   ```

4. **修复 `vitest.config.ts`**
   - 把 `setupFiles: []` 改为 `setupFiles: ['./tests/setup.ts']`
   - 其余保持（node 默认 + jsdom for components + `@` alias）

5. **强化 `tests/helpers/test-db.ts`**
   - 导出 `prisma`（连 `TEST_DATABASE_URL`）
   - `cleanDatabase()`：`prisma.article.deleteMany()` + `prisma.user.deleteMany()`（注意外键顺序：先 article 后 user）
   - `createTestUser({ username, password, role })`：bcrypt 哈希后创建
   - `createTestArticle({ title, content, authorId, ... })`：创建文章
   - `afterAll` 关闭连接

---

### 阶段 C：验证种子脚本与开发库

**目标**：确认阶段 A 修复生效。

1. 运行 `npm run db:seed`（即 `tsx prisma/seed.ts`）
2. 预期：创建 2 个 ADMIN（admin/admin123）+ 3 个 USER + 5 篇文章，无报错
3. 用 psql 抽查 `SELECT username, role FROM users;`

---

### 阶段 D：API 路由测试

**目标**：覆盖用户要求的「登录/注册、文章 CRUD、权限校验」。

**文件清单**：

#### `tests/api/auth.test.ts`（认证接口）
- **注册接口** `POST /api/auth/register`
  - ✅ 正确邀请码 + 合法用户名/密码 → 201，密码在 DB 中为 bcrypt 哈希（非明文）
  - ❌ 错误邀请码 → 400
  - ❌ 用户名 < 2 字符 → 400
  - ❌ 密码 < 6 字符 → 400
  - ❌ 重复用户名 → 409
- **登录** 通过 NextAuth `/api/auth/callback/credentials`（可选：直接测 `lib/auth.ts` 的 authorize 函数，见阶段 F）

#### `tests/api/articles.test.ts`（文章 CRUD + 权限）
- **GET 列表**
  - ✅ 已登录 → 200 + 数组
  - ❌ 未登录 → 401
  - ✅ `?search=keyword` 过滤生效
- **POST 创建**
  - ✅ ADMIN → 201，文章落库，authorId 为当前用户
  - ✅ 未提供 excerpt → 自动从 content 截取
  - ❌ USER → 403
  - ❌ 未登录 → 401
  - ❌ 缺 title/content → 400
- **GET 单篇** `GET /api/articles/:id`
  - ✅ 存在 → 200
  - ❌ 不存在 → 404
- **PUT 更新**
  - ✅ ADMIN → 200，字段更新
  - ❌ USER → 403
- **DELETE 删除**
  - ✅ ADMIN → 200，DB 中已删
  - ❌ USER → 403（普通用户不能删文章）
  - ❌ 未登录 → 401

#### `tests/api/users.test.ts`（用户管理 + 权限）
- **GET 列表**
  - ✅ ADMIN → 200，不含 password 字段
  - ❌ USER → 403
- **DELETE 删除**
  - ✅ ADMIN 删他人 → 200
  - ❌ ADMIN 删自己 → 400
  - ❌ USER → 403

**测试模式**：
- 用 `tests/helpers/mock-request.ts` 的 `createRequest()` 构造 `NextRequest`
- 用 `createRouteContext(id)` 构造动态路由 `params`
- 通过 mock `@/lib/auth` 的 `auth()` 返回值模拟不同会话状态（已登录 ADMIN / 已登录 USER / 未登录 null）
- `beforeEach` 调 `cleanDatabase()`，需要用户时调 `createTestUser()`

**关键 mock 片段**（在测试文件顶部）：
```ts
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));
import { auth } from '@/lib/auth';
// 在各用例里
vi.mocked(auth).mockResolvedValueOnce({ user: { id, role: 'ADMIN' } } as any);
```

---

### 阶段 E：组件测试

**目标**：覆盖「文章列表展示、登录表单提交、管理员按钮可见性」。

**Mock 策略**：每个组件测试文件顶部
```ts
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
import { useSession } from 'next-auth/react';
```

**文件清单**：

#### `tests/components/ArticleList.test.tsx`（文章列表展示）
- 渲染 `app/(dashboard)/articles/page.tsx` 的列表部分（或抽取 `ArticleGrid` 组件）
- ✅ mock `fetch('/api/articles')` 返回 3 篇文章 → 断言 3 个标题出现
- ✅ 空列表 → 显示空状态文案
- ✅ fetch 失败 → 显示错误提示

#### `tests/components/LoginForm.test.tsx`（登录表单提交）
- 渲染 `app/(auth)/login/page.tsx`
- ✅ 输入用户名 + 密码 → 点提交 → 调用 `signIn('credentials', { username, password, redirect: false })`
- ✅ 缺字段时提交按钮禁用或显示校验
- ✅ `signIn` 返回 error → 显示错误信息
- ✅ loading 状态 → 按钮文案变为「登录中...」

#### `tests/components/Sidebar.test.tsx`（管理员按钮可见性）
- 渲染 `components/layout/Sidebar.tsx`
- ✅ `useSession` 返回 role=ADMIN → 「发布文章」「用户管理」链接可见
- ✅ `useSession` 返回 role=USER → 上述链接**不**可见，仅「文章列表」可见
- ✅ 未登录（session=null）→ 「文章列表」链接渲染（但实际由 middleware 拦截），用户信息区显示未登录态
- ✅ 点退出 → 调用 `signOut({ redirect: false })`

**注意**：
- 组件测试用 jsdom 环境（由 `environmentMatchGlobs` 自动匹配）
- `fetch` 用 `vi.stubGlobal('fetch', vi.fn())` mock
- `next/navigation` 的 `useRouter`/`usePathname` 也需 mock

---

### 阶段 F：业务逻辑 / 数据库测试

**目标**：覆盖「bcrypt 加密、邀请码校验、Prisma 操作」。

**文件清单**：

#### `tests/lib/auth.test.ts`（认证业务逻辑）
- 直接 import `lib/auth.ts` 中导出的 `authorize` 函数（若未导出则测试注册路由的业务逻辑等价路径）
- 或测试 `app/api/auth/register/route.ts` 的内部行为（通过 HTTP 调用 + DB 查询验证）
- ✅ 正确密码 → 返回 user 对象（含 id/username/role）
- ✅ 错误密码 → 返回 null
- ✅ 用户不存在 → 返回 null
- ✅ 创建的用户密码在 DB 中是 bcrypt 哈希（`bcrypt.compare` 为 true，且不等于明文）

#### `tests/lib/invitation.test.ts`（邀请码校验逻辑）
- 测试 `app/api/auth/register/route.ts` 中的邀请码分支
- ✅ `INVITATION_CODE="F2Z4Q6"` + 请求体 `invitationCode="F2Z4Q6"` → 通过
- ❌ 邀请码不匹配 → 400 + `{ error: '邀请码无效' }`
- ❌ 邀请码为空 → 400
- （可选）若邀请码逻辑被抽成纯函数，直接对纯函数做单元测试

#### `tests/lib/prisma.test.ts`（Prisma 操作与数据校验）
- ✅ 创建 User → `password` 字段为 bcrypt 哈希格式（`$2a$` / `$2b$` 开头）
- ✅ 创建 Article → `authorId` 关联正确，`excerpt` 自动生成，`published` 默认 false
- ✅ User→Article 一对多：删除 User 时级联删除其 Article（`onDelete: Cascade`）
- ✅ `username` 唯一约束：重复插入抛 `PrismaClientKnownRequestError` (P2002)
- ✅ `tags` 数组字段读写正确

---

## 四、假设与约定

1. **测试运行前置条件**：本地 PostgreSQL 已启动，`mydb` 与 `mydb_test` 两个库均已 `prisma db push` 同步表结构
2. **测试隔离**：每个测试文件 `beforeEach` 调 `cleanDatabase()`；不依赖种子数据，测试内自建用户/文章
3. **环境变量**：测试时 `TEST_DATABASE_URL` 必须存在，否则 `test-db.ts` 抛错并跳过
4. **mock 边界**：
   - API 测试：mock `@/lib/auth` 的 `auth()`，**不** mock Prisma（连真实测试库）
   - 组件测试：mock `next-auth/react`、`next/navigation`、`fetch`，**不**连数据库
   - 业务逻辑测试：连真实测试库验证真实 SQL 行为
5. **角色枚举**：`ADMIN` / `USER`（来自 schema）
6. **不改动项**：文章详情 Server Component 直查 Prisma 的实现保持不变；`@auth/prisma-adapter` 虽未使用但不删（避免引入无关变更）

---

## 五、验证步骤

### 阶段 A-C 验证（基础设施）
```bash
# 1. 装包
npm install @prisma/adapter-pg pg && npm install -D @types/pg

# 2. 建测试库（手动）
createdb -U postgres mydb_test

# 3. 同步测试库表结构
DATABASE_URL="postgresql://postgres:Pg123456@localhost:5432/mydb_test?schema=public" npx prisma db push

# 4. 跑种子脚本（验证开发库连接）
npm run db:seed
# 期望：无 datasourceUrl 报错，输出创建日志

# 5. 抽查
psql -U postgres -d mydb -c "SELECT username, role FROM users;"
```

### 阶段 D-F 验证（测试）
```bash
# 跑全部测试
npm run test:run

# 期望输出：
# Test Files  9 passed (9)
#      Tests  ~40+ passed
```

测试文件预期清单（9 个）：
1. `tests/api/auth.test.ts`
2. `tests/api/articles.test.ts`
3. `tests/api/users.test.ts`
4. `tests/components/ArticleList.test.tsx`
5. `tests/components/LoginForm.test.tsx`
6. `tests/components/Sidebar.test.tsx`
7. `tests/lib/auth.test.ts`
8. `tests/lib/invitation.test.ts`
9. `tests/lib/prisma.test.ts`

### 回归验证
```bash
npm run dev
# 浏览器访问 http://localhost:3000
# 1. 用 admin/admin123 登录 → 跳转 /articles
# 2. 创建文章 → 列表可见
# 3. 退出 → 用普通用户登录 → 看不到「发布文章」入口
# 4. 直接访问 /articles/new → 被 middleware 拦截到 /articles
```

---

## 六、执行顺序建议

按依赖关系串行执行（每阶段完成后再进入下一阶段）：

1. **阶段 A** → 解锁 DB 访问
2. **阶段 B** → 建立测试环境
3. **阶段 C** → 验证 A 生效（跑 seed）
4. **阶段 D** → API 测试（依赖 B 的测试库）
5. **阶段 E** → 组件测试（不依赖 DB，可并行）
6. **阶段 F** → 业务逻辑测试（依赖 B 的测试库）

阶段 E 与 D/F 无依赖，可并行编写。但为保证测试基础设施稳定，建议 D 跑通后再写 E。
