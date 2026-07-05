import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { validateInvitationCode } from '@/lib/invitation';

export async function POST(request: Request) {
  try {
    const { username, password, code } = await request.json();

    // 校验邀请码
    const invitationResult = validateInvitationCode(code);
    if (!invitationResult.valid) {
      return NextResponse.json(
        { error: invitationResult.error },
        { status: 400 }
      );
    }

    // 校验用户名非空
    if (!username || username.trim().length < 2) {
      return NextResponse.json(
        { error: '用户名至少需要 2 个字符' },
        { status: 400 }
      );
    }

    // 校验密码长度
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要 6 位' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 409 }
      );
    }

    // 加密密码并创建用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
