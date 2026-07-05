import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequest, createRouteContext } from '../helpers/mock-request';
import {
  cleanDatabase,
  createTestUser,
  prisma,
} from '../helpers/test-db';

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { GET } from '@/app/api/users/route';
import { DELETE } from '@/app/api/users/[id]/route';

import type { User } from '@/app/generated/prisma/client';

let adminUser: User;
let normalUser: User;

beforeEach(async () => {
  await cleanDatabase();
  adminUser = await createTestUser('admin_user', 'ADMIN');
  normalUser = await createTestUser('normal_user', 'USER');
  vi.mocked(auth).mockReset();
});

function mockAdmin() {
  vi.mocked(auth).mockResolvedValueOnce({
    user: { id: adminUser.id, username: adminUser.username, role: 'ADMIN' },
  } as any);
}

function mockUser() {
  vi.mocked(auth).mockResolvedValueOnce({
    user: { id: normalUser.id, username: normalUser.username, role: 'USER' },
  } as any);
}

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValueOnce(null as any);
}

describe('GET /api/users', () => {
  it('ADMIN 获取用户列表成功，且不含 password 字段', async () => {
    mockAdmin();
    const req = createRequest('/api/users');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
    // 确认不含 password 字段
    data.forEach((u: Record<string, unknown>) => {
      expect(u).not.toHaveProperty('password');
      expect(u).toHaveProperty('id');
      expect(u).toHaveProperty('username');
      expect(u).toHaveProperty('role');
    });
  });

  it('普通用户无权限，返回 403', async () => {
    mockUser();
    const res = await GET();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('无权限');
  });

  it('未登录返回 401', async () => {
    mockUnauthenticated();
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/users/:id', () => {
  it('ADMIN 删除其他用户成功，返回 204', async () => {
    mockAdmin();
    const req = createRequest(`/api/users/${normalUser.id}`, { method: 'DELETE' });
    const res = await DELETE(req, createRouteContext(normalUser.id));
    expect(res.status).toBe(204);

    // 确认已删除
    const found = await prisma.user.findUnique({ where: { id: normalUser.id } });
    expect(found).toBeNull();
  });

  it('ADMIN 不能删除自己，返回 400', async () => {
    mockAdmin();
    const req = createRequest(`/api/users/${adminUser.id}`, { method: 'DELETE' });
    const res = await DELETE(req, createRouteContext(adminUser.id));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('不能删除自己');

    // 确认未被删除
    const found = await prisma.user.findUnique({ where: { id: adminUser.id } });
    expect(found).not.toBeNull();
  });

  it('普通用户无权限删除，返回 403', async () => {
    mockUser();
    const req = createRequest(`/api/users/${adminUser.id}`, { method: 'DELETE' });
    const res = await DELETE(req, createRouteContext(adminUser.id));
    expect(res.status).toBe(403);

    // 确认未被删除
    const found = await prisma.user.findUnique({ where: { id: adminUser.id } });
    expect(found).not.toBeNull();
  });

  it('未登录返回 401', async () => {
    mockUnauthenticated();
    const req = createRequest('/api/users/some-id', { method: 'DELETE' });
    const res = await DELETE(req, createRouteContext('some-id'));
    expect(res.status).toBe(401);
  });
});
