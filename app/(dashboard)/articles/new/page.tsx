'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MarkdownEditor from '@/components/editor/MarkdownEditor';

export default function NewArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (title: string, content: string, tags: string[]) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '发布失败');
        return;
      }
      router.push('/articles');
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

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
        <h1>发布新文章</h1>
        <p className="page-desc">使用 Markdown 撰写文章内容</p>
      </div>
      <div className="page-body">
        <MarkdownEditor mode="create" onSubmit={handleSubmit} />
        {error && <p style={{ color: 'var(--destructive-solid)', marginTop: '12px' }}>{error}</p>}
        {loading && <p style={{ marginTop: '12px' }}>发布中...</p>}
      </div>
    </>
  );
}
