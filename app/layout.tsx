import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers/Providers";

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
		<html lang="zh-CN" suppressHydrationWarning>
			<body className="is-admin">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
