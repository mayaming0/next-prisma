# Golden Blog 前端开发计划

## 一、项目调研结论

### 1.1 设计概览
- **设计来源**: `blog-design/index.html` + `blog-design/styles.css`
- **设计风格**: Golden Time Editorial（金色编辑风格）— 暖色调、杂志感、衬线标题 + 无衬线正文
- **字体组合**: Fraunces (衬线/标题) + Inter (无衬线/UI)
- **主色调**: 深棕色 (#3D3328) 文字 + 米黄色 (#FAF7F0) 背景 + 金色 (#A68B3C) 点缀 + 灰米色 (#C9BEA3) 辅助

### 1.2 设计包含的页面
1. **登录页** (Login)
2. **注册页** (Register)
3. **文章列表页** (Articles List) — 网格布局卡片
4. **文章详情页** (Article Detail) — Markdown 渲染 + 目录侧边栏
5. **发布文章页** (Publish) — Markdown 编辑器 + 实时预览（管理员）
6. **编辑文章页** (Edit) — 同上，预填充内容（管理员）
7. **用户管理页** (Users) — 数据表格（管理员）

### 1.3 现有技术栈
- **框架**: Next.js 16.2.10 (App Router) + React 19
- **样式**: Tailwind CSS v4 (@tailwindcss/postcss)
- **Markdown**: react-markdown + remark-gfm + github-markdown-css
- **UI 库**: antd 6.5.0 + @ant-design/icons
- **认证**: next-auth v5 beta + @auth/prisma-adapter
- **数据库**: Prisma 7.8 + PostgreSQL（本次不开发后端）
- **语言**: TypeScript

### 1.4 关键决策
- 不使用 antd 组件，完全按设计文件自定义实现（保持设计独特性）
- 使用 Tailwind CSS v4 的 `@theme` 配置设计 token
- 复杂组件样式使用全局 CSS + CSS 变量，与 Tailwind 并存
- 前端使用 mock 数据，不调用真实 API

---

## 二、文件与模块结构

### 2.1 目录结构

```
app/
├── (auth)/                          # 认证路由组
│   ├── layout.tsx                   # 认证布局
│   ├── login/page.tsx               # 登录页
│   └── register/page.tsx            # 注册页
├── (dashboard)/                     # 仪表盘路由组（含侧边栏）
│   ├── layout.tsx                   # 仪表盘布局（侧边栏 + 主内容）
│   ├── articles/
│   │   ├── page.tsx                 # 文章列表页
│   │   ├── [id]/
│   │   │   ├── page.tsx             # 文章详情页
│   │   │   └── edit/
│   │   │       └── page.tsx         # 编辑文章页（admin）
│   │   └── new/
│   │       └── page.tsx             # 发布新文章页（admin）
│   └── users/
│       └── page.tsx                 # 用户管理页（admin）
├── layout.tsx                       # 根布局
└── globals.css                      # 全局样式

components/
├── ui/                              # 基础 UI 组件
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Tag.tsx
│   └── SearchBar.tsx
├── layout/
│   ├── Sidebar.tsx                  # 侧边栏
│   └── MobileHeader.tsx             # 移动端顶栏
├── articles/
│   ├── ArticleCard.tsx              # 文章卡片
│   ├── ArticleGrid.tsx              # 文章网格
│   ├── MarkdownRenderer.tsx         # Markdown 渲染
│   └── TableOfContents.tsx          # 目录
├── editor/
│   ├── MarkdownEditor.tsx           # Markdown 编辑器
│   └── EditorToolbar.tsx            # 编辑器工具栏
└── admin/
    ├── DataTable.tsx                # 数据表格
    └── UserTable.tsx                # 用户表格

lib/
├── mock-data.ts                     # Mock 数据
└── types.ts                         # TypeScript 类型定义
```

### 2.2 需要修改/新建的文件

| 类型 | 文件路径 | 说明 |
|------|---------|------|
| 修改 | `app/globals.css` | 集成设计 token、字体、基础样式 |
| 修改 | `app/layout.tsx` | 配置字体、元数据 |
| 修改 | `app/page.tsx` | 重定向到文章列表 |
| 新建 | `app/(auth)/layout.tsx` | 认证页面布局 |
| 新建 | `app/(auth)/login/page.tsx` | 登录页 |
| 新建 | `app/(auth)/register/page.tsx` | 注册页 |
| 新建 | `app/(dashboard)/layout.tsx` | 仪表盘布局（侧边栏） |
| 新建 | `app/(dashboard)/articles/page.tsx` | 文章列表页 |
| 新建 | `app/(dashboard)/articles/[id]/page.tsx` | 文章详情页 |
| 新建 | `app/(dashboard)/articles/new/page.tsx` | 发布文章页 |
| 新建 | `app/(dashboard)/articles/[id]/edit/page.tsx` | 编辑文章页 |
| 新建 | `app/(dashboard)/users/page.tsx` | 用户管理页 |
| 新建 | `components/ui/Button.tsx` | 按钮组件 |
| 新建 | `components/ui/Input.tsx` | 输入框组件 |
| 新建 | `components/ui/Avatar.tsx` | 头像组件 |
| 新建 | `components/ui/Badge.tsx` | 徽章组件 |
| 新建 | `components/ui/Tag.tsx` | 标签组件 |
| 新建 | `components/ui/SearchBar.tsx` | 搜索栏组件 |
| 新建 | `components/layout/Sidebar.tsx` | 侧边栏组件 |
| 新建 | `components/layout/MobileHeader.tsx` | 移动端顶栏 |
| 新建 | `components/articles/ArticleCard.tsx` | 文章卡片 |
| 新建 | `components/articles/ArticleGrid.tsx` | 文章网格 |
| 新建 | `components/articles/MarkdownRenderer.tsx` | Markdown 渲染 |
| 新建 | `components/articles/TableOfContents.tsx` | 目录组件 |
| 新建 | `components/editor/MarkdownEditor.tsx` | Markdown 编辑器 |
| 新建 | `components/admin/DataTable.tsx` | 数据表格 |
| 新建 | `lib/mock-data.ts` | Mock 数据 |
| 新建 | `lib/types.ts` | 类型定义 |

---

## 三、实施步骤

### 阶段一：基础样式与设计系统（第 1-2 步）

1. **配置全局样式与设计 Token**
   - 在 `globals.css` 中定义 CSS 变量（颜色、字体、间距、圆角、阴影等）
   - 配置 Tailwind `@theme` 关联设计 token
   - 引入 Fraunces 和 Inter 字体（使用 `next/font/google`）
   - 重置基础样式，设置默认排版

2. **配置根布局**
   - 修改 `app/layout.tsx` 配置字体变量
   - 更新 metadata 标题和描述
   - 设置 body 基础样式

### 阶段二：基础 UI 组件（第 3-4 步）

3. **创建基础 UI 组件库**
   - Button（primary/secondary/outline/ghost/destructive，多种尺寸）
   - Input（文本输入、密码输入）
   - Avatar（头像）
   - Badge（角色徽章 admin/user）
   - Tag（文章标签）
   - SearchBar（搜索栏）

4. **创建布局组件**
   - Sidebar（侧边栏导航，含品牌、菜单、用户信息、退出按钮）
   - MobileHeader（移动端顶部栏 + 菜单按钮）

### 阶段三：认证页面（第 5 步）

5. **实现认证页面**
   - `(auth)` 布局：居中卡片，渐变背景
   - 登录页：用户名/密码表单，跳转注册链接
   - 注册页：用户名/密码/邀请码表单，跳转登录链接
   - 前端表单交互（纯 mock，点击后跳转）

### 阶段四：文章列表与详情（第 6-7 步）

6. **实现文章列表页**
   - 页面头部（标题 + 描述 + 搜索栏）
   - 文章网格（3 列，响应式）
   - 文章卡片组件（标签、标题、摘要、作者、日期）
   - 卡片入场动画
   - 管理员可见的删除按钮

7. **实现文章详情页**
   - 返回链接
   - 文章头部（标签、标题、作者信息、日期）
   - Markdown 内容渲染（使用 react-markdown + remark-gfm）
   - 自定义 Markdown 样式（匹配设计）
   - 目录侧边栏（sticky 定位）
   - 上一篇/下一篇导航

### 阶段五：编辑器与管理功能（第 8-9 步）

8. **实现 Markdown 编辑器**
   - 双栏布局（编辑器 + 预览）
   - 标题输入
   - 工具栏提示
   - textarea 编辑区
   - 实时预览面板
   - 标签输入（添加/删除标签 chip）
   - 底部操作按钮（保存草稿/发布文章）

9. **实现用户管理页**
   - 数据表格组件
   - 用户列表（头像、用户名、角色、注册时间、操作）
   - 角色徽章样式
   - 操作按钮（编辑/删除）

### 阶段六：仪表盘布局与路由整合（第 10 步）

10. **仪表盘布局与路由**
    - `(dashboard)` 布局：侧边栏 + 主内容区
    - 移动端侧边栏抽屉效果
    - 页面切换过渡动画
    - 首页重定向到 /articles

### 阶段七：Mock 数据与交互（第 11 步）

11. **Mock 数据与前端交互**
    - 定义 TypeScript 类型（Article, User, Tag 等）
    - 创建 mock 数据（5 篇文章、5 个用户）
    - 实现前端路由导航（使用 next/link + useRouter）
    - 实现标签增删、文章删除等纯前端交互
    - 管理员状态模拟（默认以管理员身份登录，展示 admin-only 内容）

### 阶段八：响应式与优化（第 12 步）

12. **响应式适配与细节优化**
    - 桌面端（>1024px）：3 列文章网格，双栏编辑器
    - 平板端（768-1024px）：2 列文章网格，单栏编辑器
    - 移动端（<768px）：1 列文章，侧边栏抽屉
    - 滚动条样式
    - 交互动画微调整

---

## 四、潜在依赖与注意事项

### 4.1 已有依赖（无需新增）
- `react-markdown` + `remark-gfm` — Markdown 渲染
- `next/font/google` — 字体加载（Next.js 内置）
- `tailwindcss` v4 — 样式框架

### 4.2 不需要的依赖
- `antd` — 不使用，完全自定义 UI（避免破坏设计一致性）
- `next-auth` — 本次不做后端认证，纯前端 mock

### 4.3 注意事项
- **设计还原度优先**：严格按照 `blog-design/styles.css` 的样式实现，包括间距、圆角、阴影、颜色、字体
- **CSS 变量体系**：所有设计 token 使用 CSS 变量定义，便于后续主题切换
- **TypeScript 类型安全**：所有组件和数据都要有明确的类型定义
- **App Router 规范**：使用 Next.js 16 App Router 最佳实践，区分 Server Component 和 Client Component
- **Client Component 标记**：有交互的组件（按钮、侧边栏、编辑器等）需要加 `'use client'`
- **不做后端**：所有数据用 mock，表单提交只做前端跳转，不调用 API

---

## 五、风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|---------|
| Tailwind v4 与自定义 CSS 共存问题 | 样式冲突 | 使用 CSS 变量 + Tailwind `@theme` 配置，复杂组件用全局 CSS 类名 |
| Markdown 样式与设计不一致 | 视觉差异 | 为 .markdown-body 编写完整的自定义样式，覆盖 react-markdown 默认样式 |
| 编辑器实时预览性能 | 输入卡顿 | 使用 debounce 或 React state 直接渲染（Markdown 内容不多时可接受） |
| 响应式布局遗漏 | 移动端显示异常 | 严格按照设计文件中的 media query 断点实现，每完成一个页面就测试响应式 |
| 字体加载闪烁 (FOIT) | 用户体验 | 使用 `next/font` 的 display: swap 配置，预连接字体服务器 |

---

## 六、验证标准

1. **视觉还原**：所有页面与设计文件在视觉上一致（颜色、字体、间距、圆角）
2. **页面完整**：7 个页面全部实现，可通过导航访问
3. **响应式**：桌面、平板、手机三端布局正确
4. **交互正常**：按钮点击、页面跳转、侧边栏切换、标签增删等交互正常
5. **Mock 数据**：文章列表、用户列表展示 mock 数据
6. **无 TS 错误**：TypeScript 编译通过，无类型错误
7. **无 Lint 错误**：ESLint 检查通过
