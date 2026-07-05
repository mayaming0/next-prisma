'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/ui/SearchBar';
import ArticleGrid from '@/components/articles/ArticleGrid';
import type { Article } from '@/lib/types';

export default function ArticlesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/articles');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '获取文章失败');
        }
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取文章失败');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>文章列表</h1>
            <p className="page-desc">全栈开发学习笔记与技术分享</p>
          </div>
          <SearchBar
            placeholder="搜索文章..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
      </div>
      <div className="page-body">
        {loading ? (
          <p>加载中...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <ArticleGrid articles={filteredArticles} />
        )}
      </div>
    </>
  );
}
