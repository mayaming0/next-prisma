'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push('/articles');
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
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 7h6" />
            <path d="M8 11h4" />
          </svg>
        </div>
        <h1>Golden Blog</h1>
        <p>Full-Stack 全栈学习笔记</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="用户名"
          id="login-username"
          type="text"
          placeholder="请输入用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="密码"
          id="login-password"
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" size="full">
          登录
        </Button>
      </form>
      <div className="auth-footer">
        还没有账号？{' '}
        <Link href="/register">注册新账号</Link>
      </div>
    </div>
  );
}
