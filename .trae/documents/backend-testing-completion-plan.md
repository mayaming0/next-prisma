# 后端测试补齐计划（阶段 E + F）

> 目标：完成用户要求的三类测试中剩余的两类——组件测试与业务逻辑测试，并跑通全部测试。
> 阶段 A-D（Prisma 修复 + 测试库 + API 测试 30 个）已完成且全部通过，本计划仅覆盖剩余工作。

---

## 一、当前状态

### 已完成
- **基础设施**：`vitest.config.ts` 已加载 dotenv 并在模块导入前把 `DATABASE_URL` 覆盖为 `TEST_DATABASE_URL`；`fileParallelism: false`；`tests/setup.ts` 加载 jest-dom matchers
- **测试库**：`mydb_test` 已建表，`tests/helpers/test-db.ts` 导出 `prisma` / `cleanDatabase` / `createTestUser` / `createTestArticle`
- **API 测试**（3 文件，30 用例，全绿）：
  - `tests/api/auth.test.ts` — 6 用例（注册邀请码/bcrypt/校验/重复）
  - `tests/api/articles.test.ts` — 17 用例（CRUD + 权限 + 搜索）
  - `tests/api/users.test.ts` — 7 用例（列表 + 删除 + 权限）

### 待完成
- `tests/components/` 目录不存在 → 阶段 E 的 3 个组件测试文件
- `tests/lib/` 目录不存在 → 阶段 F 的 3 个业务逻辑测试文件
- 为支持 `authorize` 与邀请码逻辑的独立单元测试，需做两处最小重构

---

## 二、关键决策（已与用户确认）

| 决策点 | 选择 |
|--------|------|
| 组件测试 Session mock | `vi.mock('next-auth/react')` |
| 业务逻辑测试方式 | **小重构后单元测试**：提取 `authorize` 为导出函数；提取邀请码校验为 `lib/invitation.ts` 纯函数 |
| 测试数据库 | 独立 `mydb_test`（已就绪） |
| 测试串行 | `fileParallelism: false`（已就绪） |

---

## 三、实施步骤

### 阶段 E：组件测试（3 文件）

**通用 Mock 模式**（每个组件测试文件顶部）：
```ts
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));
```
组件测试用 jsdom 环境（由 `environmentMatchGlobs` 自动匹配 `tests/components/**`），不连数据库。

---

#### E1. `tests/components/ArticleList.test.tsx`

**测试对象**：`app/(dashboard)/articles/page.tsx`（Client Component，`useEffect` 调 `fetch('/api/articles')`）

**Mock 策略**：
- `vi.stubGlobal('fetch', vi.fn())` mock 全局 `fetch`
- 不 mock `next-auth/react`（该页面不使用 session）
- 不 mock `next/navigation`（该页面不使用 router）

**用例**（3 个）：
1. **fetch 成功返回 3 篇文章 → 列表渲染 3 个标题**
   - `fetch` mock 为 `vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [3 篇文章] })`
   - 渲染 `<ArticlesPage />`，用 `waitFor` 等待 `useEffect` 完成
   - 断言 3 个标题文案出现在屏幕上
   - 断言不显示「加载中...」

2. **空列表 → 不渲染任何文章卡片**
   - `fetch` mock 返回 `[]`
   - 渲染后等待加载完成
   - 断言「加载中...」消失，文章列表区域为空（无 `.article-card` 元素）

3. **fetch 抛错 → 显示错误提示**
   - `fetch` mock 为 `vi.fn().mockRejectedValueOnce(new Error('网络错误'))`
   - 渲染后等待
   - 断言错误文案「网络错误」出现

**测试数据**：构造符合 `Article` 类型（`lib/types.ts`）的对象数组：
```ts
const mockArticles = [
  { id: '1', title: '第一篇', content: '...', excerpt: '摘要1', tags: ['tag1'], author: { id: 'a1', username: 'admin', role: 'ADMIN' }, published: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '2', title: '第二篇', ... },
  { id: '3', title: '第三篇', ... },
];
```

**注意事项**：
- 每个用例之间需重置 `fetch` mock（`beforeEach` 中 `vi.restoreAllMocks()` 或重新 stub）
- 使用 `@testing-library/react` 的 `render` / `screen` / `waitFor` / `findByText`

---

#### E2. `tests/components/LoginForm.test.tsx`

**测试对象**：`app/(auth)/login/page.tsx`（Client Component，调 `signIn('credentials', {...})`）

**Mock 策略**：
- `vi.mock('next-auth/react')` → mock `signIn`
- `vi.mock('next/navigation')` → mock `useRouter` 返回 `{ push: vi.fn() }`

**用例**（3 个）：
1. **填写用户名 + 密码 → 提交 → 调用 `signIn` 参数正确**
   - `signIn` mock 为 `vi.fn().mockResolvedValue({ error: null })`
   - 用 `fireEvent.change` 在用户名输入框输入 `'admin'`，密码框输入 `'admin123'`
   - 用 `fireEvent.click` 点击提交按钮
   - 等待后断言 `signIn` 被调用，参数为 `('credentials', { username: 'admin', password: 'admin123', redirect: false })`

2. **`signIn` 返回 error → 显示「用户名或密码错误」**
   - `signIn` mock 返回 `{ error: 'CredentialsSignin' }`
   - 填写表单并提交
   - 断言屏幕出现「用户名或密码错误」文案

3. **提交中 → 按钮文案变为「登录中...」且禁用**
   - `signIn` mock 返回一个可控的 Promise（`new Promise(() => {})` 永不 resolve，保持 loading 态）
   - 填写并提交
   - 断言按钮文案为「登录中...」且 `disabled`

**输入框定位**：LoginPage 中 Input 组件的 `id` 分别为 `login-username` 和 `login-password`，用 `screen.getByLabelText('用户名')` / `screen.getByLabelText('密码')` 定位（Input 组件渲染了 `<label>` 关联）。

---

#### E3. `tests/components/Sidebar.test.tsx`

**测试对象**：`components/layout/Sidebar.tsx`（Client Component，用 `useSession` 控制管理员区块可见性）

**Mock 策略**：
- `vi.mock('next-auth/react')` → mock `useSession` + `signOut`
- `vi.mock('next/navigation')` → mock `usePathname` 返回 `'/'` + `useRouter` 返回 `{ push: vi.fn() }`

**用例**（3 个）：
1. **`useSession` 返回 role=ADMIN → 「发布文章」「用户管理」链接可见**
   - `vi.mocked(useSession).mockReturnValue({ data: { user: { id: '1', username: 'admin', role: 'ADMIN' } }, status: 'authenticated' } as any)`
   - 渲染 `<Sidebar isOpen={true} onClose={() => {}} />`
   - 断言「发布文章」和「用户管理」文案在屏幕上
   - 断言「管理员」角色文案出现

2. **`useSession` 返回 role=USER → 上述管理员链接不可见，仅「文章列表」**
   - `vi.mocked(useSession).mockReturnValue({ data: { user: { id: '2', username: 'user', role: 'USER' } }, status: 'authenticated' } as any)`
   - 渲染
   - 断言「文章列表」在屏幕上
   - 断言「发布文章」不在屏幕上（`expect(screen.queryByText('发布文章')).toBeNull()`）
   - 断言「用户管理」不在屏幕上

3. **点击「退出登录」→ 调用 `signOut({ redirect: false })` 并跳转 `/login`**
   - ADMIN session mock
   - `signOut` mock 为 `vi.fn()`
   - `router.push` mock
   - 渲染后点击「退出登录」按钮
   - 断言 `signOut` 被调用，参数为 `{ redirect: false }`
   - 断言 `router.push` 被调用，参数为 `'/login'`

---

### 阶段 F：业务逻辑测试（2 处重构 + 3 文件）

#### F0a. 重构 `lib/auth.ts` — 提取 `authorize` 为导出函数

**改动**：将 `authorize` 逻辑提取为独立导出函数 `credentialsAuthorize`，`Credentials({ authorize: credentialsAuthorize })` 引用它。

**改动后 `lib/auth.ts` 关键结构**：
```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/lib/auth.config';
import { prisma } from '@/lib/db';

/** 校验用户名密码，返回用户对象或 null。供 Credentials provider 与测试共用。 */
export async function credentialsAuthorize(credentials: Partial<Record<'username' | 'password', unknown>> | undefined): Promise<{ id: string; username: string; role: 'ADMIN' | 'USER' } | null> {
  const username = credentials?.username as string | undefined;
  const password = credentials?.password as string | undefined;

  if (!username || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: credentialsAuthorize,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'ADMIN' | 'USER';
      }
      return session;
    },
  },
});
```

**行为不变**：函数逻辑一字未改，仅从内联箭头函数变为命名导出函数。

---

#### F0b. 创建 `lib/invitation.ts` — 邀请码校验纯函数

**新文件 `lib/invitation.ts`**：
```ts
/**
 * 校验邀请码是否正确。
 * @param code 用户提交的邀请码
 * @returns valid=true 表示通过；valid=false 时附带 error 文案
 */
export function validateInvitationCode(
  code: string | undefined | null
): { valid: boolean; error?: string } {
  if (!code || code !== process.env.INVITATION_CODE) {
    return { valid: false, error: '邀请码无效' };
  }
  return { valid: true };
}
```

**重构 `app/api/auth/register/route.ts`**：将第 9-15 行的内联校验替换为调用 `validateInvitationCode`：
```ts
import { validateInvitationCode } from '@/lib/invitation';
// ...
const invitationResult = validateInvitationCode(code);
if (!invitationResult.valid) {
  return NextResponse.json(
    { error: invitationResult.error },
    { status: 400 }
  );
}
```
其余逻辑（用户名/密码校验、bcrypt、create）不变。已有 `tests/api/auth.test.ts` 应继续通过（行为不变）。

---

#### F1. `tests/lib/auth.test.ts`（认证业务逻辑）

**测试对象**：从 `lib/auth.ts` 导入的 `credentialsAuthorize` 函数

**连接真实测试库**（通过 `tests/helpers/test-db.ts`），`beforeEach` 调 `cleanDatabase()`。

**用例**（4 个）：
1. **正确密码 → 返回 `{ id, username, role }`**
   - `createTestUser('loginuser', 'USER', 'password123')` 预置用户
   - 调 `credentialsAuthorize({ username: 'loginuser', password: 'password123' })`
   - 断言返回值非 null，`username === 'loginuser'`，`role === 'USER'`，`id` 为字符串

2. **错误密码 → 返回 null**
   - 预置同上用户
   - 调 `credentialsAuthorize({ username: 'loginuser', password: 'wrongpass' })`
   - 断言返回 `null`

3. **用户不存在 → 返回 null**
   - 不预置用户
   - 调 `credentialsAuthorize({ username: 'ghost', password: 'password123' })`
   - 断言返回 `null`

4. **缺用户名或密码 → 返回 null**
   - 调 `credentialsAuthorize({ password: 'password123' })` → null
   - 调 `credentialsAuthorize({ username: 'x' })` → null
   - 调 `credentialsAuthorize(undefined)` → null

**验证 bcrypt 被使用**：用例 1 中额外断言 DB 里的密码不等于明文 `'password123'`，且 `await bcrypt.compare('password123', dbUser.password)` 为 true（确认走的是 bcrypt 比较而非明文）。

---

#### F2. `tests/lib/invitation.test.ts`（邀请码校验纯函数）

**测试对象**：从 `lib/invitation.ts` 导入的 `validateInvitationCode` 函数

**不连数据库**（纯函数测试）。需确保 `process.env.INVITATION_CODE` 已加载（`vitest.config.ts` 已加载 dotenv，值为 `'F2Z4Q6'`）。

**用例**（4 个）：
1. **正确邀请码 → `{ valid: true }`**
   - `validateInvitationCode('F2Z4Q6')` → `{ valid: true }`，无 `error` 字段

2. **错误邀请码 → `{ valid: false, error: '邀请码无效' }`**
   - `validateInvitationCode('WRONG')` → valid=false, error='邀请码无效'

3. **空字符串 → `{ valid: false, error: '邀请码无效' }`**
   - `validateInvitationCode('')` → valid=false

4. **undefined / null → `{ valid: false, error: '邀请码无效' }`**
   - `validateInvitationCode(undefined)` → valid=false
   - `validateInvitationCode(null)` → valid=false

---

#### F3. `tests/lib/prisma.test.ts`（Prisma 操作与数据校验）

**测试对象**：直接使用 `tests/helpers/test-db.ts` 的 `prisma` 操作测试库

**用例**（5 个）：
1. **创建 User → password 为 bcrypt 哈希格式**
   - `createTestUser('hashcheck', 'USER', 'mypwd')`
   - 查 DB 取 `password` 字段
   - 断言 `password !== 'mypwd'`（非明文）
   - 断言 `password` 匹配 `/^\$2[ab]\$\d{2}\$/`（bcrypt 格式）
   - 断言 `await bcrypt.compare('mypwd', password)` 为 true

2. **创建 Article → tags 数组读写正确，author 关联正确**
   - 先建用户，再 `createTestArticle(userId, { tags: ['React', 'Next.js', '测试'] })`
   - 查 DB `prisma.article.findUnique({ where: { id }, include: { author: ... } })`
   - 断言 `tags` 长度 3 且包含 `'React'`
   - 断言 `author.username` 等于建用户时的用户名
   - 断言 `published` 默认为 true（`createTestArticle` 默认值）

3. **删除 User → 其 Article 级联删除**（`onDelete: Cascade`）
   - 建用户 + 2 篇文章
   - `prisma.user.delete({ where: { id: userId } })`
   - 断言 `prisma.article.count({ where: { authorId: userId } })` 为 0
   - 断言 `prisma.user.count()` 为 0

4. **username 唯一约束 → 重复插入抛 P2002**
   - `createTestUser('unique_user')`
   - 再次 `createTestUser('unique_user')` 应抛错
   - 用 `try/catch` 捕获，断言 `error.code === 'P2002'`（Prisma 唯一约束违反码）

5. **更新 Article → 字段正确更新**
   - 建用户 + 文章
   - `prisma.article.update({ where: { id }, data: { title: '新标题', published: false } })`
   - 重新查询，断言 `title === '新标题'` 且 `published === false`

---

## 四、验证步骤

### 1. 阶段 E + F 完成后，跑全部测试
```bash
npm run test:run
```

**预期**：
```
Test Files  9 passed (9)
     Tests  ~50 passed
```

测试文件预期清单（9 个）：
1. `tests/api/auth.test.ts` — 6 用例（已通过）
2. `tests/api/articles.test.ts` — 17 用例（已通过）
3. `tests/api/users.test.ts` — 7 用例（已通过）
4. `tests/components/ArticleList.test.tsx` — 3 用例（新）
5. `tests/components/LoginForm.test.tsx` — 3 用例（新）
6. `tests/components/Sidebar.test.tsx` — 3 用例（新）
7. `tests/lib/auth.test.ts` — 4 用例（新）
8. `tests/lib/invitation.test.ts` — 4 用例（新）
9. `tests/lib/prisma.test.ts` — 5 用例（新）

### 2. 回归验证（重构未破坏现有功能）
- 重跑 `tests/api/auth.test.ts`（6 用例）确认 register 路由重构后行为不变
- 可选：`npm run dev` 手动验证登录 + 注册 + 文章 CRUD

---

## 五、假设与约定

1. **测试前置**：`mydb_test` 库已建表，`.env` 中 `TEST_DATABASE_URL` 与 `INVITATION_CODE="F2Z4Q6"` 已配置
2. **重构范围**：仅 `lib/auth.ts`（提取导出函数）与 `app/api/auth/register/route.ts`（调用纯函数）两处改动，新增 `lib/invitation.ts`，行为完全不变
3. **组件测试不连库**：`tests/components/**` 用 jsdom，mock `fetch` / `next-auth/react` / `next/navigation`，不导入 `test-db.ts`
4. **业务逻辑测试连真实测试库**：`tests/lib/auth.test.ts` 与 `tests/lib/prisma.test.ts` 用 `test-db.ts`；`tests/lib/invitation.test.ts` 是纯函数测试不连库
5. **执行顺序**：先做 F0a/F0b 重构 → 写 F1/F2/F3 → 写 E1/E2/E3 → 全量回归

---

## 六、执行顺序

1. **F0a** 重构 `lib/auth.ts`（提取 `credentialsAuthorize`）
2. **F0b** 创建 `lib/invitation.ts` + 重构 `app/api/auth/register/route.ts`
3. **F2** `tests/lib/invitation.test.ts`（最简单，验证 F0b）
4. **F1** `tests/lib/auth.test.ts`（验证 F0a）
5. **F3** `tests/lib/prisma.test.ts`
6. **E1** `tests/components/ArticleList.test.tsx`
7. **E2** `tests/components/LoginForm.test.tsx`
8. **E3** `tests/components/Sidebar.test.tsx`
9. **全量回归** `npm run test:run`
