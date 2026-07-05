'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('密码至少需要 6 位');
      return;
    }

    if (!code.trim()) {
      setError('请输入邀请码');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
      } else {
        router.push('/login');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card page-view">
      <div className="auth-brand">
        <div className="brand-logo">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <h1>加入 Golden Blog</h1>
        <p>创建账号，开始你的全栈之旅</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="用户名"
          id="reg-username"
          type="text"
          placeholder="选择一个用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="密码"
          id="reg-password"
          type="password"
          placeholder="设置密码（至少6位）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="邀请码"
          id="reg-code"
          type="text"
          placeholder="输入管理员提供的邀请码"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <p className="auth-error">{error}</p>}
        <Button type="submit" variant="primary" size="full" disabled={loading}>
          {loading ? '创建中...' : '创建账号'}
        </Button>
      </form>
      <div className="auth-footer">
        已有账号？{' '}
        <Link href="/login">立即登录</Link>
      </div>
    </div>
  );
}
