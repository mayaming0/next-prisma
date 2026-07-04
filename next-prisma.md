# 项目说明

这是一个带登录注册的个人博客系统（无评论），专注于全栈知识学习分享。
技术栈：Next.js + PostgreSQL + Prisma + React + NextAuth.js（Auth.js）+ ant-design + Tailwind CSS + bcrypt + TypeScript + react-markdown + remark-gfm + github-markdown-css

- 用户体系分为 管理员和普通用户：
    1. 管理员可以发布文章、删除文章、编辑文章、查看用户列表、删除用户。
    2. 普通用户只能查看文章。
- 登录注册模块：
    1. 登录页面 只含 用户名和密码
    2. 注册页面 只含 用户名和密码和邀请码(邀请码为.env 中的INVITATION_CODE，邀请码不正确则注册失败)
    3. 管理员固定用户名为admin，密码为admin123（无需注册）
- 文章模块：
    1. 文章列表页：展示所有文章，管理员可以删除文章。
    2. 文章详情页：展示文章内容，管理员可以编辑文章。
    3. 发布文章页：管理员可以发布文章; 支持文章通过 Markdown 编辑器进行编辑，支持文章通过上传markdown文件进行上传（不支持其他文件）
    4. 编辑文章页：管理员可以编辑文章。
- 用户模块：
    1. 用户列表页：管理员可以查看所有用户，管理员可以删除用户。
- 样式模块：
    1. 使用 ant-design 组件库。
    2. 使用 Tailwind CSS 进行样式定制。
- 路由模块：
    1. 使用 Next.js 的 `next/router` 进行页面跳转。
    2. 使用 Next.js 的 `next/link` 组件进行页面链接。
- 数据库模块：
    1. 使用 PostgreSQL 数据库存储用户、文章、评论等数据。
    2. 使用 Prisma ORM 进行数据库操作。
- 安全模块：
    1. 使用 NextAuth.js（Auth.js）进行用户认证。
    2. 使用 bcrypt 进行密码加密。
