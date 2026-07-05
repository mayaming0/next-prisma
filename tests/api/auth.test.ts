import { describe, it, expect, beforeEach } from 'vitest';
import { createRequest } from '../helpers/mock-request';
import { cleanDatabase, prisma } from '../helpers/test-db';
import bcrypt from 'bcryptjs';

import { POST } from '@/app/api/auth/register/route';

const VALID_CODE = 'F2Z4Q6';

beforeEach(async () => {
  await cleanDatabase();
});

describe('POST /api/auth/register', () => {
  it('正确邀请码 + 合法用户名/密码 → 201，密码被 bcrypt 加密', async () => {
    const req = createRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'newuser',
        password: 'password123',
        code: VALID_CODE,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.username).toBe('newuser');
    expect(data.role).toBe('USER');
    expect(data).not.toHaveProperty('password');

    // 确认密码已加密（非明文）
    const dbUser = await prisma.user.findUnique({ where: { username: 'newuser' } });
    expect(dbUser).not.toBeNull();
    expect(dbUser!.password).not.toBe('password123');
    // bcrypt 哈希格式校验
    expect(dbUser!.password).toMatch(/^\$2[ab]\$/);
    // bcrypt.compare 校验
    expect(await bcrypt.compare('password123', dbUser!.password)).toBe(true);
  });

  it('错误邀请码 → 400', async () => {
    const req = createRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'newuser',
        password: 'password123',
        code: 'WRONG_CODE',
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('邀请码无效');

    // 确认未创建用户
    const count = await prisma.user.count();
    expect(count).toBe(0);
  });

  it('邀请码为空 → 400', async () => {
    const req = createRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'newuser',
        password: 'password123',
        code: '',
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('邀请码无效');
  });

  it('用户名少于 2 字符 → 400', async () => {
    const req = createRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'a',
        password: 'password123',
        code: VALID_CODE,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('用户名至少需要 2 个字符');
  });

  it('密码少于 6 位 → 400', async () => {
    const req = createRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'newuser',
        password: '12345',
        code: VALID_CODE,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('密码至少需要 6 位');
  });

  it('重复用户名 → 409', async () => {
    // 先创建一个用户
    await prisma.user.create({
      data: {
        username: 'existing',
        password: await bcrypt.hash('password123', 10),
        role: 'USER',
      },
    });

    const req = createRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'existing',
        password: 'password123',
        code: VALID_CODE,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('用户名已存在');
  });
});
