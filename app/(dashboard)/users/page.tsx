'use client';

import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/admin/DataTable';
import { mockUsers } from '@/lib/mock-data';
import type { User } from '@/lib/types';

export default function UsersPage() {
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
        <DataTable columns={columns} data={mockUsers} />
      </div>
    </>
  );
}
