## Next.js 项目集成 next-auth 完整分析

### 1. 依赖与版本

package.json 中使用了 **next-auth v5 (beta)**：

```json
"next-auth": "^5.0.0-beta.31"
```

其他相关依赖：

- `bcryptjs` — 密码加密与校验
- `@auth/prisma-adapter` — Prisma 适配器（项目中实际未使用数据库 session，但已引入）

### 2. 核心文件结构

```
lib/
├── auth.ts          # NextAuth 主配置（导出 handlers, auth, signIn, signOut）
├── auth.config.ts   # 共享配置（pages, session strategy, callbacks 骨架）
├── credentials.ts   # Credentials provider 的 authorize 函数
└── types.ts         # TypeScript 类型增强（Session, User, JWT）

middleware.ts        # 路由级访问控制（未登录重定向、权限校验）

components/providers/Providers.tsx  # SessionProvider 客户端包装

app/api/auth/[...nextauth]/route.ts  # Auth API 路由入口
```

---

### 3. 认证流程详解

#### 3.1 入口：API 路由

route.ts：

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

这是 next-auth v5 的标准 catch-all 路由，将所有 auth 请求（如登录、session 获取、登出）交给 next-auth 处理。

#### 3.2 核心配置：auth.ts

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { credentialsAuthorize } from "@/lib/credentials";

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
				session.user.role = token.role as "ADMIN" | "USER";
			}
			return session;
		},
	},
});
```

关键点：

- **使用 Credentials provider**（用户名+密码），而非 OAuth
- **JWT session 策略**（不依赖数据库 session）
- **JWT callback**：用户登录成功后，将 `id` 和 `role` 写入 JWT token
- **Session callback**：每次读取 session 时，从 JWT token 中提取 `id` 和 `role` 注入到 `session.user`

#### 3.3 共享配置：auth.config.ts

```typescript
export const authConfig: NextAuthConfig = {
	pages: {
		signIn: "/login",
	},
	providers: [],
	session: {
		strategy: "jwt",
	},
	callbacks: {
		jwt({ token, user }) {
			/* ... */
		},
		session({ session, token }) {
			/* ... */
		},
	},
};
```

这个配置被 auth.ts 和 middleware.ts 共享，保持一致性。

#### 3.4 密码校验：credentials.ts

```typescript
export async function credentialsAuthorize(credentials) {
	const { username, password } = credentials || {};
	if (!username || !password) return null;

	const user = await prisma.user.findUnique({ where: { username } });
	if (!user) return null;

	const passwordMatch = await bcrypt.compare(password, user.password);
	if (!passwordMatch) return null;

	return { id: user.id, username: user.username, role: user.role };
}
```

流程：

1. 从 credentials 中提取 `username` 和 `password`
2. 通过 Prisma 查询用户
3. 用 `bcrypt.compare` 校验密码
4. 成功则返回用户对象（含 id, username, role）

#### 3.5 前端登录：page.tsx

```typescript
import { signIn } from "next-auth/react";

const result = await signIn("credentials", {
	username,
	password,
	redirect: false,
});

if (result?.error) {
	setError("用户名或密码错误");
} else {
	router.push("/articles");
}
```

- 使用 `signIn('credentials', ...)` 触发 credentials 认证
- `redirect: false` 让前端自己控制导航
- 登录成功 → 跳转到 `/articles`

---

### 4. SessionProvider：客户端上下文

Providers.tsx：

```tsx
"use client";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
	return <SessionProvider>{children}</SessionProvider>;
}
```

在 layout.tsx 中包裹整个应用，使所有客户端组件可以通过 `useSession()` 访问 session。

---

### 5. 客户端使用 Session

Sidebar.tsx 展示了典型用法：

```tsx
const { data: session } = useSession();
const isAdmin = session?.user?.role === "ADMIN";
```

- 根据 `role` 条件渲染管理员导航项
- 显示用户名和角色信息
- 使用 `signOut()` 登出

---

### 6. 权限控制：三层防护

#### 6.1 中间件层：middleware.ts

```typescript
export default auth((req) => {
	const { nextUrl, auth: session } = req;
	const isLoggedIn = !!session?.user;
	const user = session?.user;
	const isAdmin = user?.role === "ADMIN";

	// 已登录用户访问登录/注册页 → 重定向到文章列表
	if (isLoggedIn && (isOnLogin || isOnRegister)) {
		return Response.redirect(new URL("/articles", nextUrl));
	}

	// 未登录用户访问受保护路由 → 重定向到登录页
	if (!isLoggedIn && !isOnLogin && !isOnRegister) {
		return Response.redirect(new URL("/login", nextUrl));
	}

	// 非 ADMIN 用户访问管理员路由 → 重定向到文章列表
	if (isLoggedIn && !isAdmin && isOnAdminRoute) {
		return Response.redirect(new URL("/articles", nextUrl));
	}
});

export const config = {
	matcher: ["/articles/:path*", "/users/:path*", "/login", "/register"],
};
```

匹配规则：

- `/articles/:path*` — 受保护（需登录）
- `/users/:path*` — 受保护（需登录 + ADMIN 角色）
- `/login`, `/register` — 已登录用户访问则重定向

#### 6.2 API 路由层

每个 API 路由内部调用 `auth()` 检查认证状态：

```typescript
const session = await auth();
if (!session?.user) {
	return NextResponse.json({ error: "未登录" }, { status: 401 });
}
if (session.user.role !== "ADMIN") {
	return NextResponse.json({ error: "无权限" }, { status: 403 });
}
```

示例路由（均使用此模式）：

- route.ts — GET（需登录）、POST（需 ADMIN）
- route.ts — GET（需登录）、PUT/DELETE（需 ADMIN）
- route.ts — GET（需 ADMIN）

#### 6.3 客户端 UI 层

通过 `useSession()` 条件渲染，管理员功能仅在 role 为 ADMIN 时显示。

---

### 7. TypeScript 类型增强

types.ts 中对 next-auth 的类型进行了增强：

```typescript
declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			username: string;
			role: "ADMIN" | "USER";
		} & DefaultSession["user"];
	}
	interface User {
		role?: "ADMIN" | "USER";
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id?: string;
		role?: string;
	}
}
```

这确保了 `session.user.id` 和 `session.user.role` 有正确的类型推断。

---

### 8. 注册流程

注册 `/api/auth/register` 是一个独立的路由（非 next-auth 内置），流程：

1. 前端提交用户名、密码、邀请码
2. 后端校验邀请码 → 校验用户名唯一性 → bcrypt 加密密码 → Prisma 创建用户
3. 创建成功后前端跳转到登录页，用户再通过 next-auth 登录

---

### 9. 整体架构图

```
┌─────────────────────────────────────────────────────┐
│                    浏览器 (Client)                    │
│  Login Form → signIn('credentials')                  │
│  Sidebar    → useSession() / signOut()               │
│  Pages      → fetch('/api/articles')                 │
└──────────┬───────────────────────────────┬───────────┘
           │                               │
    ┌──────┴──────┐               ┌───────┴────────┐
    │  Middleware  │               │  API Routes     │
    │  (middleware │               │  /api/auth/...  │
    │   .ts)       │               │  /api/articles  │
    │  路由级保护   │               │  /api/users     │
    └──────────────┘               └───────┬────────┘
                                           │
                               ┌───────────┴───────────┐
                               │    next-auth core       │
                               │  lib/auth.ts            │
                               │   ├─ Credentials Provider│
                               │   ├─ JWT Callbacks      │
                               │   └─ Session Callbacks  │
                               └───────────┬───────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
               ┌────┴────┐          ┌──────┴──────┐       ┌─────┴─────┐
               │ bcrypt  │          │   Prisma    │       │  JWT      │
               │ 密码校验 │          │   User DB   │       │  Token    │
               └─────────┘          └─────────────┘       └───────────┘
```

---

### 10. 总结

| 特性         | 实现方式                                    |
| ------------ | ------------------------------------------- |
| 认证方式     | Credentials Provider（用户名+密码）         |
| Session 策略 | JWT（无数据库 session）                     |
| 密码存储     | bcrypt 加密                                 |
| 权限模型     | 两种角色：`ADMIN` 和 `USER`                 |
| 路由保护     | 中间件（Middleware）+ API 路由守卫          |
| 客户端保护   | `useSession()` 条件渲染                     |
| 类型安全     | 模块增强（Module Augmentation）             |
| 注册         | 独立 API 路由（非 next-auth），含邀请码机制 |
