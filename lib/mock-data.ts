import { Article, User } from './types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'Dragon Fu',
    role: 'ADMIN',
    createdAt: '2026-01-15',
  },
  {
    id: 'user-2',
    username: 'Lina Wang',
    role: 'ADMIN',
    createdAt: '2026-02-20',
  },
  {
    id: 'user-3',
    username: 'Mike Chen',
    role: 'USER',
    createdAt: '2026-03-10',
  },
  {
    id: 'user-4',
    username: 'Sarah Liu',
    role: 'USER',
    createdAt: '2026-04-05',
  },
  {
    id: 'user-5',
    username: 'Jack Zhang',
    role: 'USER',
    createdAt: '2026-05-18',
  },
];

const sampleContent = `## 前言

在过去的几年中，全栈 JavaScript/TypeScript 生态发生了翻天覆地的变化。Next.js 从传统的 SSR 框架演进为支持 App Router、Server Components 和 Server Actions 的全栈平台。Prisma 作为新一代的 TypeScript ORM，以其直观的数据模型定义语言和类型安全的查询 API，极大地简化了数据库操作。

本文将记录我从零开始构建一个博客系统的完整过程，涵盖技术选型、架构设计、核心功能实现等方方面面。

## 技术栈概览

本项目选择以下技术栈：

- **Next.js 15** — 使用 App Router 架构，支持 React Server Components
- **Prisma** — 类型安全的 ORM，用于数据库操作
- **PostgreSQL** — 可靠的关系型数据库
- **TypeScript** — 端到端类型安全
- **Tailwind CSS** — 实用优先的 CSS 框架

## 架构设计

项目采用经典的分层架构：

\`\`\`
blog/
  app/
    api/          # API 路由
    (auth)/       # 认证相关页面
    articles/      # 文章相关页面
  prisma/
    schema.prisma # 数据模型定义
  lib/
    auth.ts       # 认证工具函数
    db.ts         # 数据库客户端
\`\`\`

> 使用 Prisma Schema 定义数据模型是整个项目的基石。清晰的数据模型设计能减少后期大量的重构工作。

## 数据库模型设计

核心数据模型包括用户、文章和分类三张表。以下是简化版的 Prisma Schema：

\`\`\`
model User {
  id       String   @id @default(cuid())
  username String   @unique
  password String
  role     Role     @default(USER)
  articles Article[]
  createdAt DateTime @default(now())
}

model Article {
  id        String   @id @default(cuid())
  title     String
  content   String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
\`\`\`

## API 路由实现

Next.js 的 Route Handlers 让我们能够快速构建 RESTful API。结合 Prisma 的类型安全查询，代码既简洁又可靠。

关键点在于使用 \`NextRequest\` 和 \`NextResponse\` 处理 HTTP 请求和响应，并通过中间件进行认证校验。

## 部署与总结

开发完成后，可以使用 Vercel 进行一键部署。PostgreSQL 推荐使用 Supabase 或 Neon 等托管服务，免去运维烦恼。

通过这个项目，我深刻体会到了现代全栈开发工具链的强大之处。从数据库定义到 API 开发再到前端渲染，TypeScript 提供了端到端的类型安全保障，极大提升了开发效率和代码质量。

---

如果你也在学习全栈开发，希望这篇文章能为你提供一些参考。 Happy coding!`;

export const mockArticles: Article[] = [
  {
    id: 'article-1',
    title: '深入理解 React Server Components：从原理到实践',
    content: sampleContent,
    excerpt:
      'Server Components 是 React 架构的一次根本性变革。本文从 RSC 的设计初衷讲起，深入分析其序列化协议、流式渲染机制，以及在 Next.js 中的实际应用模式。',
    tags: ['React', 'Server Actions'],
    author: {
      id: 'user-1',
      username: 'Dragon Fu',
      role: 'ADMIN',
    },
    published: true,
    createdAt: '2026-06-28',
    updatedAt: '2026-06-28',
  },
  {
    id: 'article-2',
    title: 'Prisma ORM 进阶：复杂查询、事务处理与性能优化',
    content: sampleContent,
    excerpt:
      '掌握了 Prisma 的基础 CRUD 后，如何在生产环境中写出高效的数据库查询？本文涵盖联表查询、聚合函数、事务管理、连接池配置和慢查询分析。',
    tags: ['Prisma', 'PostgreSQL'],
    author: {
      id: 'user-1',
      username: 'Dragon Fu',
      role: 'ADMIN',
    },
    published: true,
    createdAt: '2026-06-25',
    updatedAt: '2026-06-25',
  },
  {
    id: 'article-3',
    title: 'TypeScript 5.x 高级类型编程：掌握类型系统的艺术',
    content: sampleContent,
    excerpt:
      '从条件类型到模板字面量类型，从递归类型到类型推断，本文带你深入 TypeScript 的类型系统，掌握那些看似晦涩却异常强大的类型编程技巧。',
    tags: ['TypeScript', '类型体操'],
    author: {
      id: 'user-2',
      username: 'Lina Wang',
      role: 'ADMIN',
    },
    published: true,
    createdAt: '2026-06-22',
    updatedAt: '2026-06-22',
  },
  {
    id: 'article-4',
    title: 'Docker Compose 实战：Next.js + PostgreSQL 开发环境一键搭建',
    content: sampleContent,
    excerpt:
      '告别手动配置环境变量的烦恼，使用 Docker Compose 统一管理开发环境的数据库、应用服务。本文提供完整的 docker-compose.yml 和多阶段构建方案。',
    tags: ['Docker', 'DevOps'],
    author: {
      id: 'user-1',
      username: 'Dragon Fu',
      role: 'ADMIN',
    },
    published: true,
    createdAt: '2026-06-19',
    updatedAt: '2026-06-19',
  },
  {
    id: 'article-5',
    title: '从设计系统到代码：用 Tailwind CSS 构建一致的 UI 组件库',
    content: sampleContent,
    excerpt:
      '如何将设计师的 Figma 规范转化为可维护的 CSS 变量和组件代码？本文以一个实际项目为例，演示从 Design Token 提取到组件封装的全流程。',
    tags: ['Tailwind CSS', 'UI 设计'],
    author: {
      id: 'user-3',
      username: 'Mike Chen',
      role: 'USER',
    },
    published: true,
    createdAt: '2026-06-15',
    updatedAt: '2026-06-15',
  },
];

export function getArticleById(id: string): Article | undefined {
  return mockArticles.find((a) => a.id === id);
}

export function getAdjacentArticles(id: string): { prev?: Article; next?: Article } {
  const index = mockArticles.findIndex((a) => a.id === id);
  return {
    prev: index > 0 ? mockArticles[index - 1] : undefined,
    next: index < mockArticles.length - 1 ? mockArticles[index + 1] : undefined,
  };
}
