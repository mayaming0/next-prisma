import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL 未设置。请在 .env 中配置测试数据库连接字符串，例如：\n' +
      'TEST_DATABASE_URL="postgresql://postgres:Pg123456@localhost:5432/mydb_test?schema=public"\n' +
      '并确保已对该库执行过 prisma db push 同步表结构。'
  );
}

const pool = new Pool({ connectionString: testDatabaseUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter, log: ['error'] });

/** 清空测试数据库的所有业务表（注意外键顺序：先 article 后 user） */
export async function cleanDatabase() {
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
}

/** 创建测试用户，密码会被 bcrypt 哈希后写入数据库 */
export async function createTestUser(
  username: string,
  role: 'ADMIN' | 'USER' = 'USER',
  password: string = 'password123'
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role,
    },
  });
}

/** 创建测试文章 */
export async function createTestArticle(
  authorId: string,
  overrides: Partial<{
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    published: boolean;
  }> = {}
) {
  return prisma.article.create({
    data: {
      title: overrides.title || '测试文章标题',
      content: overrides.content || '## 测试内容\n\n这是一段测试内容。',
      excerpt: overrides.excerpt || '测试摘要',
      tags: overrides.tags || ['测试'],
      authorId,
      published: overrides.published ?? true,
    },
    include: {
      author: {
        select: { id: true, username: true, role: true },
      },
    },
  });
}

afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
});
