'use client';

import { useState } from 'react';
import SearchBar from '@/components/ui/SearchBar';
import ArticleGrid from '@/components/articles/ArticleGrid';
import { mockArticles } from '@/lib/mock-data';

export default function ArticlesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = mockArticles.filter(
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
        <ArticleGrid articles={filteredArticles} />
      </div>
    </>
  );
}
