import bcrypt from 'bcryptjs';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const sampleContent = `## 前言

在过去的几年中，全栈 JavaScript/TypeScript 生态发生了翻天覆地的变化。Next.js 从传统的 SSR 框架演进为支持 App Router、Server Components 和 Server Actions 的全栈平台。Prisma 作为新一代的 TypeScript ORM，以其直观的数据模型定义语言和类型安全的查询 API，极大地简化了数据库操作。

本文将记录我从零开始构建一个博客系统的完整过程，涵盖技术选型、架构设计、核心功能实现等方方面面。

## 技术栈概览

本项目选择以下技术栈：

- **Next.js 16** — 使用 App Router 架构，支持 React Server Components
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
    articles/     # 文章相关页面
  prisma/
    schema.prisma # 数据模型定义
  lib/
    auth.ts       # 认证工具函数
    db.ts         # 数据库客户端
\`\`\`

> 使用 Prisma Schema 定义数据模型是整个项目的基石。清晰的数据模型设计能减少后期大量的重构工作。

## 数据库模型设计

核心数据模型包括用户和文章两张表。

## API 路由实现

Next.js 的 Route Handlers 让我们能够快速构建 RESTful API。结合 Prisma 的类型安全查询，代码既简洁又可靠。

## 部署与总结

开发完成后，可以使用 Vercel 进行一键部署。PostgreSQL 推荐使用 Supabase 或 Neon 等托管服务，免去运维烦恼。

通过这个项目，我深刻体会到了现代全栈开发工具链的强大之处。从数据库定义到 API 开发再到前端渲染，TypeScript 提供了端到端的类型安全保障，极大提升了开发效率和代码质量。

---

如果你也在学习全栈开发，希望这篇文章能为你提供一些参考。 Happy coding!`;

async function main() {
  // 创建用户
  const users = [
    { username: 'Dragon Fu', role: 'ADMIN' as const },
    { username: 'Lina Wang', role: 'ADMIN' as const },
    { username: 'Mike Chen', role: 'USER' as const },
    { username: 'Sarah Liu', role: 'USER' as const },
    { username: 'Jack Zhang', role: 'USER' as const },
  ];

  const hashedPassword = await bcrypt.hash('password123', 10);

  const createdUsers = [];
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        password: hashedPassword,
        role: user.role,
      },
    });
    createdUsers.push(created);
  }

  console.log(`Created ${createdUsers.length} users`);

  // 创建文章
  const articles = [
    {
      title: '深入理解 React Server Components：从原理到实践',
      excerpt: 'Server Components 是 React 架构的一次根本性变革。本文从 RSC 的设计初衷讲起，深入分析其序列化协议、流式渲染机制，以及在 Next.js 中的实际应用模式。',
      tags: ['React', 'Server Actions'],
      authorIndex: 0,
    },
    {
      title: 'Prisma ORM 进阶：复杂查询、事务处理与性能优化',
      excerpt: '掌握了 Prisma 的基础 CRUD 后，如何在生产环境中写出高效的数据库查询？本文涵盖联表查询、聚合函数、事务管理、连接池配置和慢查询分析。',
      tags: ['Prisma', 'PostgreSQL'],
      authorIndex: 0,
    },
    {
      title: 'TypeScript 5.x 高级类型编程：掌握类型系统的艺术',
      excerpt: '从条件类型到模板字面量类型，从递归类型到类型推断，本文带你深入 TypeScript 的类型系统，掌握那些看似晦涩却异常强大的类型编程技巧。',
      tags: ['TypeScript', '类型体操'],
      authorIndex: 1,
    },
    {
      title: 'Docker Compose 实战：Next.js + PostgreSQL 开发环境一键搭建',
      excerpt: '告别手动配置环境变量的烦恼，使用 Docker Compose 统一管理开发环境的数据库、应用服务。本文提供完整的 docker-compose.yml 和多阶段构建方案。',
      tags: ['Docker', 'DevOps'],
      authorIndex: 0,
    },
    {
      title: '从设计系统到代码：用 Tailwind CSS 构建一致的 UI 组件库',
      excerpt: '如何将设计师的 Figma 规范转化为可维护的 CSS 变量和组件代码？本文以一个实际项目为例，演示从 Design Token 提取到组件封装的全流程。',
      tags: ['Tailwind CSS', 'UI 设计'],
      authorIndex: 2,
    },
  ];

  // 先清空旧文章
  await prisma.article.deleteMany();

  for (const article of articles) {
    await prisma.article.create({
      data: {
        title: article.title,
        content: sampleContent,
        excerpt: article.excerpt,
        tags: article.tags,
        authorId: createdUsers[article.authorIndex].id,
        published: true,
      },
    });
  }

  console.log(`Created ${articles.length} articles`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
