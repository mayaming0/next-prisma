// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

import { signIn } from 'next-auth/react';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoginPage 登录表单', () => {
  it('填写用户名 + 密码 → 提交 → 调用 signIn 参数正确', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: null } as never);

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('用户名');
    const passwordInput = screen.getByLabelText('密码');
    const submitButton = screen.getByRole('button', { name: '登录' });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledTimes(1);
    });

    expect(signIn).toHaveBeenCalledWith('credentials', {
      username: 'admin',
      password: 'admin123',
      redirect: false,
    });
  });

  it('signIn 返回 error → 显示「用户名或密码错误」', async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: 'CredentialsSignin',
    } as never);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('用户名'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByLabelText('密码'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(screen.getByText('用户名或密码错误')).toBeInTheDocument();
    });
  });

  it('提交中 → 按钮文案变为「登录中...」且禁用', async () => {
    // signIn 返回永不 resolve 的 Promise，保持 loading 态
    vi.mocked(signIn).mockReturnValue(new Promise(() => {}) as never);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('用户名'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByLabelText('密码'), {
      target: { value: 'admin123' },
    });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      const loadingButton = screen.getByRole('button', { name: '登录中...' });
      expect(loadingButton).toBeDisabled();
    });
  });
});
