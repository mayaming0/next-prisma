import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 获取文章列表
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { excerpt: { contains: search, mode: 'insensitive' as const } },
          { tags: { hasSome: [search] } },
        ],
      }
    : {};

  const articles = await prisma.article.findMany({
    where,
    include: {
      author: {
        select: { id: true, username: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(articles);
}

// 创建新文章
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  try {
    const { title, content, excerpt, tags } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const article = await prisma.article.create({
      data: {
        title,
        content,
        excerpt: excerpt || content.slice(0, 150).replace(/[#*>\-`]/g, '').trim(),
        tags: tags || [],
        authorId: session.user.id,
        published: true,
      },
      include: {
        author: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
