'use client';

import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import type { Article } from '@/lib/types';

interface ArticleCardProps {
  article: Article;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

export default function ArticleCard({ article, isAdmin = true, onDelete }: ArticleCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(article.id);
  };

  return (
    <Link href={`/articles/${article.id}`} className="article-card">
      {isAdmin && (
        <button className="card-delete-btn admin-only" title="删除文章" onClick={handleDelete}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      )}
      <div className="card-tags">
        {article.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      <h3>{article.title}</h3>
      <p className="card-excerpt">{article.excerpt}</p>
      <div className="card-meta">
        <div className="card-meta-left">
          <Avatar name={article.author.username} size="sm" />
          <div>
            <div className="card-author-name">{article.author.username}</div>
          </div>
        </div>
        <div className="card-date">{article.createdAt}</div>
      </div>
    </Link>
  );
}
