import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { credentialsAuthorize } from '@/lib/credentials';
import { cleanDatabase, createTestUser, prisma } from '../helpers/test-db';

beforeEach(async () => {
  await cleanDatabase();
});

describe('credentialsAuthorize', () => {
  it('正确密码 → 返回 { id, username, role }', async () => {
    await createTestUser('loginuser', 'USER', 'password123');

    const result = await credentialsAuthorize({
      username: 'loginuser',
      password: 'password123',
    });

    expect(result).not.toBeNull();
    expect(result!.username).toBe('loginuser');
    expect(result!.role).toBe('USER');
    expect(typeof result!.id).toBe('string');

    // 确认走的是 bcrypt 比较，而非明文
    const dbUser = await prisma.user.findUnique({
      where: { username: 'loginuser' },
    });
    expect(dbUser!.password).not.toBe('password123');
    expect(await bcrypt.compare('password123', dbUser!.password)).toBe(true);
  });

  it('错误密码 → 返回 null', async () => {
    await createTestUser('loginuser', 'USER', 'password123');

    const result = await credentialsAuthorize({
      username: 'loginuser',
      password: 'wrongpass',
    });

    expect(result).toBeNull();
  });

  it('用户不存在 → 返回 null', async () => {
    const result = await credentialsAuthorize({
      username: 'ghost',
      password: 'password123',
    });

    expect(result).toBeNull();
  });

  it('缺用户名或密码 → 返回 null', async () => {
    expect(
      await credentialsAuthorize({ password: 'password123' })
    ).toBeNull();
    expect(await credentialsAuthorize({ username: 'x' })).toBeNull();
    expect(await credentialsAuthorize(undefined)).toBeNull();
  });
});
