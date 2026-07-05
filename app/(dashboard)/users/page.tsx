'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/admin/DataTable';
import type { User } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '加载失败');
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users ?? []);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (user: User) => {
    if (!window.confirm(`确定要删除用户 "${user.username}" 吗？`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '删除失败');
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setError('');
    } catch {
      setError('网络错误');
    }
  };

  const columns = [
    {
      key: 'username',
      header: '用户名',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Avatar name={user.username} size="sm" />
          <span>{user.username}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: '角色',
      render: (user: User) => (
        <Badge variant={user.role === 'ADMIN' ? 'admin' : 'user'}>
          {user.role === 'ADMIN' ? '管理员' : '用户'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: '注册时间',
    },
    {
      key: 'actions',
      header: '操作',
      render: (user: User) => (
        <div className="table-actions">
          <Button variant="ghost" size="sm">
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: 'var(--destructive-solid)' } as React.CSSProperties}
            onClick={() => handleDelete(user)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <Link href="/articles" className="back-link">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回文章列表
        </Link>
        <h1>用户管理</h1>
        <p className="page-desc">查看和管理系统中的所有用户</p>
      </div>
      <div className="page-body">
        {loading ? (
          <p>加载中...</p>
        ) : error ? (
          <p style={{ color: 'var(--destructive-solid)' }}>{error}</p>
        ) : (
          <DataTable columns={columns} data={users} />
        )}
      </div>
    </>
  );
}
