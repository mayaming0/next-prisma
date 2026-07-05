// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ArticlesPage from '@/app/(dashboard)/articles/page';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: { id: '1', username: 'admin', role: 'ADMIN' },
    },
    status: 'authenticated',
  })),
}));

const mockArticles = [
  {
    id: '1',
    title: '第一篇',
    content: '内容1',
    excerpt: '摘要1',
    tags: ['tag1'],
    author: { id: 'a1', username: 'admin', role: 'ADMIN' as const },
    published: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: '2',
    title: '第二篇',
    content: '内容2',
    excerpt: '摘要2',
    tags: ['tag2'],
    author: { id: 'a2', username: 'user1', role: 'USER' as const },
    published: true,
    createdAt: '2026-01-02',
    updatedAt: '2026-01-02',
  },
  {
    id: '3',
    title: '第三篇',
    content: '内容3',
    excerpt: '摘要3',
    tags: ['tag3'],
    author: { id: 'a3', username: 'user2', role: 'USER' as const },
    published: true,
    createdAt: '2026-01-03',
    updatedAt: '2026-01-03',
  },
];

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ArticlesPage 文章列表', () => {
  it('fetch 成功返回 3 篇文章 → 列表渲染 3 个标题', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockArticles,
    } as Response);

    render(<ArticlesPage />);

    // 等待加载完成，3 个标题出现
    await waitFor(() => {
      expect(screen.getByText('第一篇')).toBeInTheDocument();
    });
    expect(screen.getByText('第二篇')).toBeInTheDocument();
    expect(screen.getByText('第三篇')).toBeInTheDocument();

    // 不再显示加载中
    expect(screen.queryByText('加载中...')).toBeNull();
  });

  it('空列表 → 不渲染任何文章卡片', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<ArticlesPage />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).toBeNull();
    });

    // 没有文章标题出现
    expect(screen.queryByText('第一篇')).toBeNull();
  });

  it('fetch 抛错 → 显示错误提示', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('网络错误'));

    render(<ArticlesPage />);

    // 等待错误文案出现
    await waitFor(() => {
      expect(screen.getByText('网络错误')).toBeInTheDocument();
    });
  });
});
