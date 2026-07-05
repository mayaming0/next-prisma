import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequest, createRouteContext } from '../helpers/mock-request';
import {
  cleanDatabase,
  createTestUser,
  createTestArticle,
  prisma,
} from '../helpers/test-db';

// Mock @/lib/auth 以控制会话状态
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { GET, POST } from '@/app/api/articles/route';
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/articles/[id]/route';

import type { User } from '@/app/generated/prisma/client';

let adminUser: User;
let normalUser: User;

beforeEach(async () => {
  await cleanDatabase();
  adminUser = await createTestUser('admin_test', 'ADMIN');
  normalUser = await createTestUser('user_test', 'USER');
  vi.mocked(auth).mockReset();
});

/** 模拟已登录的 ADMIN 会话 */
function mockAdmin() {
  vi.mocked(auth).mockResolvedValueOnce({
    user: { id: adminUser.id, username: adminUser.username, role: 'ADMIN' },
  } as any);
}

/** 模拟已登录的普通 USER 会话 */
function mockUser() {
  vi.mocked(auth).mockResolvedValueOnce({
    user: { id: normalUser.id, username: normalUser.username, role: 'USER' },
  } as any);
}

/** 模拟未登录会话 */
function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValueOnce(null as any);
}

describe('GET /api/articles', () => {
  it('未登录返回 401', async () => {
    mockUnauthenticated();
    const req = createRequest('/api/articles');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('未登录');
  });

  it('已登录返回文章列表', async () => {
    await createTestArticle(adminUser.id, { title: '文章 A' });
    await createTestArticle(adminUser.id, { title: '文章 B' });
    mockAdmin();
    const req = createRequest('/api/articles');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
  });

  it('search 参数过滤生效', async () => {
    await createTestArticle(adminUser.id, { title: 'React 入门' });
    await createTestArticle(adminUser.id, { title: 'Vue 进阶' });
    mockAdmin();
    const req = createRequest('/api/articles?search=React');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('React 入门');
  });
});

describe('POST /api/articles', () => {
  it('ADMIN 创建文章成功，返回 201', async () => {
    mockAdmin();
    const req = createRequest('/api/articles', {
      method: 'POST',
      body: {
        title: '新文章',
        content: '这是正文内容',
        tags: ['测试'],
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe('新文章');
    expect(data.authorId).toBe(adminUser.id);
    expect(data.tags).toEqual(['测试']);

    // 确认落库
    const dbCount = await prisma.article.count();
    expect(dbCount).toBe(1);
  });

  it('未提供 excerpt 时自动从 content 截取', async () => {
    mockAdmin();
    const req = createRequest('/api/articles', {
      method: 'POST',
      body: {
        title: '无摘要文章',
        content: '## 这是一段较长的正文内容用于测试自动摘要生成逻辑',
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.excerpt).toBeTruthy();
    expect(data.excerpt.length).toBeGreaterThan(0);
  });

  it('普通用户无权限创建，返回 403', async () => {
    mockUser();
    const req = createRequest('/api/articles', {
      method: 'POST',
      body: { title: 'test', content: 'test' },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('无权限');
  });

  it('未登录返回 401', async () => {
    mockUnauthenticated();
    const req = createRequest('/api/articles', {
      method: 'POST',
      body: { title: 'test', content: 'test' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('缺少 title 或 content 返回 400', async () => {
    mockAdmin();
    const req = createRequest('/api/articles', {
      method: 'POST',
      body: { title: '只有标题' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('标题和内容不能为空');
  });
});

describe('GET /api/articles/:id', () => {
  it('文章存在返回 200', async () => {
    const article = await createTestArticle(adminUser.id, { title: '详情测试' });
    mockAdmin();
    const req = createRequest(`/api/articles/${article.id}`);
    const res = await GET_BY_ID(req, createRouteContext(article.id));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('详情测试');
  });

  it('文章不存在返回 404', async () => {
    mockAdmin();
    const req = createRequest('/api/articles/non-existent-id');
    const res = await GET_BY_ID(req, createRouteContext('non-existent-id'));
    expect(res.status).toBe(404);
  });

  it('未登录返回 401', async () => {
    mockUnauthenticated();
    const req = createRequest('/api/articles/some-id');
    const res = await GET_BY_ID(req, createRouteContext('some-id'));
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/articles/:id', () => {
  it('ADMIN 更新文章成功', async () => {
    const article = await createTestArticle(adminUser.id, { title: '原标题' });
    mockAdmin();
    const req = createRequest(`/api/articles/${article.id}`, {
      method: 'PUT',
      body: { title: '新标题' },
    });
    const res = await PUT(req, createRouteContext(article.id));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('新标题');

    // 确认 DB 已更新
    const updated = await prisma.article.findUnique({ where: { id: article.id } });
    expect(updated?.title).toBe('新标题');
  });

  it('普通用户无权限更新，返回 403', async () => {
    const article = await createTestArticle(adminUser.id, { title: '原标题' });
    mockUser();
    const req = createRequest(`/api/articles/${article.id}`, {
      method: 'PUT',
      body: { title: '篡改标题' },
    });
    const res = await PUT(req, createRouteContext(article.id));
    expect(res.status).toBe(403);
  });

  it('未登录返回 401', async () => {
    mockUnauthenticated();
    const req = createRequest('/api/articles/some-id', {
      method: 'PUT',
      body: { title: 'x' },
    });
    const res = await PUT(req, createRouteContext('some-id'));
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/articles/:id', () => {
  it('ADMIN 删除文章成功，返回 204', async () => {
    const article = await createTestArticle(adminUser.id, { title: '待删除' });
    mockAdmin();
    const req = createRequest(`/api/articles/${article.id}`, { method: 'DELETE' });
    const res = await DELETE(req, createRouteContext(article.id));
    expect(res.status).toBe(204);

    // 确认 DB 已删除
    const found = await prisma.article.findUnique({ where: { id: article.id } });
    expect(found).toBeNull();
  });

  it('普通用户不能删文章，返回 403', async () => {
    const article = await createTestArticle(adminUser.id, { title: '受保护' });
    mockUser();
    const req = createRequest(`/api/articles/${article.id}`, { method: 'DELETE' });
    const res = await DELETE(req, createRouteContext(article.id));
    expect(res.status).toBe(403);

    // 确认文章仍在
    const found = await prisma.article.findUnique({ where: { id: article.id } });
    expect(found).not.toBeNull();
  });

  it('未登录返回 401', async () => {
    mockUnauthenticated();
    const req = createRequest('/api/articles/some-id', { method: 'DELETE' });
    const res = await DELETE(req, createRouteContext('some-id'));
    expect(res.status).toBe(401);
  });
});
