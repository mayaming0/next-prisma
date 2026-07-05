'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MarkdownEditor from '@/components/editor/MarkdownEditor';

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<{
    title: string;
    content: string;
    tags: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFoundArticle, setNotFoundArticle] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/articles/${id}`);
        if (res.status === 404) {
          setNotFoundArticle(true);
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || '加载失败');
          return;
        }
        const data = await res.json();
        setArticle({
          title: data.title ?? '',
          content: data.content ?? '',
          tags: data.tags ?? [],
        });
      } catch {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const handleCancel = () => {
    router.push(`/articles/${id}`);
  };

  const handleSubmit = async (title: string, content: string, tags: string[]) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '更新失败');
        return;
      }
      router.push(`/articles/${id}`);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <Link href={`/articles/${id}`} className="back-link">
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
          返回文章详情
        </Link>
        <h1>编辑文章</h1>
        <p className="page-desc">修改文章内容后点击更新</p>
      </div>
      <div className="page-body">
        {loading && article === null && !notFoundArticle ? (
          <p>加载中...</p>
        ) : notFoundArticle ? (
          <p>文章不存在</p>
        ) : article ? (
          <>
            <MarkdownEditor
              mode="edit"
              initialTitle={article.title}
              initialContent={article.content}
              initialTags={article.tags}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
            />
            {error && <p style={{ color: 'var(--destructive-solid)', marginTop: '12px' }}>{error}</p>}
          </>
        ) : (
          <p style={{ color: 'var(--destructive-solid)' }}>{error}</p>
        )}
      </div>
    </>
  );
}
