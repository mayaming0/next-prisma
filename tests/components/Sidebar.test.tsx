// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from '@/components/layout/Sidebar';

const mockPush = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

import { useSession, signOut } from 'next-auth/react';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Sidebar 侧边栏', () => {
  it('useSession 返回 role=ADMIN → 「发布文章」「用户管理」链接可见', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', username: 'admin', role: 'ADMIN' },
      },
      status: 'authenticated',
    } as never);

    render(<Sidebar isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('发布文章')).toBeInTheDocument();
    expect(screen.getByText('用户管理')).toBeInTheDocument();
    expect(screen.getByText('管理员')).toBeInTheDocument();
  });

  it('useSession 返回 role=USER → 管理员链接不可见，仅「文章列表」', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '2', username: 'user', role: 'USER' },
      },
      status: 'authenticated',
    } as never);

    render(<Sidebar isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('文章列表')).toBeInTheDocument();
    expect(screen.queryByText('发布文章')).toBeNull();
    expect(screen.queryByText('用户管理')).toBeNull();
  });

  it('点击「退出登录」→ 调用 signOut({ redirect: false }) 并跳转 /login', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', username: 'admin', role: 'ADMIN' },
      },
      status: 'authenticated',
    } as never);

    render(<Sidebar isOpen={true} onClose={() => {}} />);

    const logoutButton = screen.getByText('退出登录');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ redirect: false });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
