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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push('/login');
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
        <Button type="submit" variant="primary" size="full">
          创建账号
        </Button>
      </form>
      <div className="auth-footer">
        已有账号？{' '}
        <Link href="/login">立即登录</Link>
      </div>
    </div>
  );
}
