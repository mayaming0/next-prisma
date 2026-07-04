'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarkdownEditor from '@/components/editor/MarkdownEditor';
import { getArticleById } from '@/lib/mock-data';

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const article = getArticleById(id);

  if (!article) {
    notFound();
  }

  const handleCancel = () => {
    router.push(`/articles/${id}`);
  };

  const handleSubmit = (title: string, content: string, tags: string[]) => {
    console.log('更新文章:', { id, title, content, tags });
    router.push(`/articles/${id}`);
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
        <MarkdownEditor
          mode="edit"
          initialTitle={article.title}
          initialContent={article.content}
          initialTags={article.tags}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
