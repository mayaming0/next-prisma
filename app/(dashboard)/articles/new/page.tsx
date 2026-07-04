'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MarkdownEditor from '@/components/editor/MarkdownEditor';

export default function NewArticlePage() {
  const router = useRouter();

  const handleSubmit = (title: string, content: string, tags: string[]) => {
    console.log('发布文章:', { title, content, tags });
    router.push('/articles');
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
      </div>
    </>
  );
}
