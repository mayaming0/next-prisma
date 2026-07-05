import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  prisma,
  cleanDatabase,
  createTestUser,
  createTestArticle,
} from '../helpers/test-db';

beforeEach(async () => {
  await cleanDatabase();
});

describe('Prisma 操作与数据校验', () => {
  it('创建 User → password 为 bcrypt 哈希格式', async () => {
    await createTestUser('hashcheck', 'USER', 'mypwd');

    const dbUser = await prisma.user.findUnique({
      where: { username: 'hashcheck' },
    });

    expect(dbUser).not.toBeNull();
    // 非明文
    expect(dbUser!.password).not.toBe('mypwd');
    // bcrypt 哈希格式（$2a$ / $2b$ 开头，后跟两位 cost）
    expect(dbUser!.password).toMatch(/^\$2[ab]\$\d{2}\$/);
    // bcrypt.compare 校验
    expect(await bcrypt.compare('mypwd', dbUser!.password)).toBe(true);
  });

  it('创建 Article → tags 数组读写正确，author 关联正确', async () => {
    const user = await createTestUser('articleAuthor', 'ADMIN', 'pass1234');
    const article = await createTestArticle(user.id, {
      tags: ['React', 'Next.js', '测试'],
    });

    const dbArticle = await prisma.article.findUnique({
      where: { id: article.id },
      include: {
        author: { select: { id: true, username: true, role: true } },
      },
    });

    expect(dbArticle).not.toBeNull();
    expect(dbArticle!.tags).toHaveLength(3);
    expect(dbArticle!.tags).toContain('React');
    expect(dbArticle!.tags).toContain('Next.js');
    expect(dbArticle!.tags).toContain('测试');
    expect(dbArticle!.author.username).toBe('articleAuthor');
    expect(dbArticle!.published).toBe(true);
  });

  it('删除 User → 其 Article 级联删除（onDelete: Cascade）', async () => {
    const user = await createTestUser('cascadeUser', 'USER', 'pass1234');
    await createTestArticle(user.id, { title: '文章一' });
    await createTestArticle(user.id, { title: '文章二' });

    // 删除前：1 用户 + 2 文章
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.article.count({ where: { authorId: user.id } })).toBe(2);

    await prisma.user.delete({ where: { id: user.id } });

    // 删除后：0 用户 + 0 文章（级联删除）
    expect(await prisma.user.count()).toBe(0);
    expect(
      await prisma.article.count({ where: { authorId: user.id } })
    ).toBe(0);
  });

  it('username 唯一约束 → 重复插入抛 P2002', async () => {
    await createTestUser('unique_user', 'USER', 'pass1234');

    let caughtError: { code?: string } | null = null;
    try {
      await createTestUser('unique_user', 'USER', 'pass1234');
    } catch (e) {
      caughtError = e as { code?: string };
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError!.code).toBe('P2002');
  });

  it('更新 Article → 字段正确更新', async () => {
    const user = await createTestUser('updateAuthor', 'ADMIN', 'pass1234');
    const article = await createTestArticle(user.id, {
      title: '原标题',
      published: true,
    });

    await prisma.article.update({
      where: { id: article.id },
      data: { title: '新标题', published: false },
    });

    const updated = await prisma.article.findUnique({
      where: { id: article.id },
    });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('新标题');
    expect(updated!.published).toBe(false);
  });
});
