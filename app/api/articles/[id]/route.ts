import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 获取单篇文章
export async function GET(_: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, username: true, role: true },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  return NextResponse.json(article);
}

// 更新文章
export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, content, excerpt, tags } = body;

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(tags !== undefined && { tags }),
      },
      include: {
        author: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除文章
export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  await prisma.article.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
