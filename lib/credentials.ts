import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

/** 校验用户名密码，返回用户对象或 null。供 Credentials provider 与测试共用。 */
export async function credentialsAuthorize(
  credentials: Partial<Record<'username' | 'password', unknown>> | undefined
): Promise<{ id: string; username: string; role: 'ADMIN' | 'USER' } | null> {
  const username = credentials?.username as string | undefined;
  const password = credentials?.password as string | undefined;

  if (!username || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}
