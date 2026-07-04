import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golden Blog - Full-Stack Learning Journal",
  description: "全栈开发学习笔记与技术分享",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="is-admin">{children}</body>
    </html>
  );
}
