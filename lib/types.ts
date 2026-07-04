export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  author: {
    id: string;
    username: string;
    role: 'ADMIN' | 'USER';
  };
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}
