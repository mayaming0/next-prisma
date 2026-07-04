'use client';

import { useState } from 'react';
import ArticleCard from './ArticleCard';
import type { Article } from '@/lib/types';

interface ArticleGridProps {
  articles: Article[];
  isAdmin?: boolean;
}

export default function ArticleGrid({ articles, isAdmin = true }: ArticleGridProps) {
  const [articleList, setArticleList] = useState(articles);

  const handleDelete = (id: string) => {
    setArticleList((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="articles-grid">
      {articleList.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isAdmin={isAdmin}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
