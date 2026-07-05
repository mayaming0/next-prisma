import Link from 'next/link';
import { notFound } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import MarkdownRenderer from '@/components/articles/MarkdownRenderer';
import TableOfContents from '@/components/articles/TableOfContents';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { TocItem } from '@/lib/types';

function extractToc(content: string): TocItem[] {
  const headingRegex = /^##\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[1].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
    items.push({ id: `section-${id}`, text, level: 2 });
  }

  return items;
}

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, username: true, role: true },
      },
    },
  });

  if (!article) {
    notFound();
  }

  const tocItems = extractToc(article.content);

  const [prev, next] = await Promise.all([
    prisma.article.findFirst({
      where: { createdAt: { gt: article.createdAt } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true },
    }),
    prisma.article.findFirst({
      where: { createdAt: { lt: article.createdAt } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    }),
  ]);

  const formattedDate = article.createdAt.toISOString().split('T')[0];

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
      </div>
      <div className="page-body">
        <div className="article-detail-layout">
          <article>
            <div className="article-detail-header">
              <div className="detail-tags">
                {article.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
              <h1>{article.title}</h1>
              <div className="article-detail-meta">
                <div className="flex items-center gap-2">
                  <Avatar name={article.author.username} size="md" />
                  <div>
                    <div className="detail-meta-name">{article.author.username}</div>
                    <div className="card-date">
                      {article.author.role === 'ADMIN' ? '管理员' : '用户'}
                    </div>
                  </div>
                </div>
                <div className="detail-meta-item">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formattedDate}
                </div>
                {session?.user?.role === 'ADMIN' && (
                  <div className="detail-meta-item admin-only">
                    <Button href={`/articles/${id}/edit`} variant="outline" size="sm">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ width: '14px', height: '14px' }}
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      编辑文章
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <MarkdownRenderer content={article.content} addHeadingIds={true} />

            <div className="article-nav">
              {prev ? (
                <Link href={`/articles/${prev.id}`} className="article-nav-item">
                  <div className="article-nav-label">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: '14px', height: '14px' }}
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    上一篇
                  </div>
                  <div className="article-nav-title">{prev.title}</div>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link href={`/articles/${next.id}`} className="article-nav-item next">
                  <div className="article-nav-label">
                    下一篇
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: '14px', height: '14px' }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                  <div className="article-nav-title">{next.title}</div>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </article>

          <TableOfContents items={tocItems} />
        </div>
      </div>
    </>
  );
}
