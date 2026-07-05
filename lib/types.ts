import type { DefaultSession } from 'next-auth';

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

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface SessionUser {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      role: 'ADMIN' | 'USER';
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'ADMIN' | 'USER';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    username?: string;
  }
}
