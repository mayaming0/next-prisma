import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
	const { nextUrl, auth: session } = req;
	const isLoggedIn = !!session?.user;
	const user = session?.user;
	const isAdmin = user?.role === "ADMIN";

	const isOnLogin = nextUrl.pathname.startsWith("/login");
	const isOnRegister = nextUrl.pathname.startsWith("/register");
	const isOnAdminRoute =
		nextUrl.pathname.startsWith("/articles/new") ||
		nextUrl.pathname.startsWith("/users");

	// 已登录用户访问登录/注册页 → 重定向到文章列表
	if (isLoggedIn && (isOnLogin || isOnRegister)) {
		return Response.redirect(new URL("/articles", nextUrl));
	}

	// 未登录用户访问受保护的非公开路由
	if (!isLoggedIn && !isOnLogin && !isOnRegister) {
		return Response.redirect(new URL("/login", nextUrl));
	}

	// 非 ADMIN 用户访问管理员路由 → 重定向到文章列表
	if (isLoggedIn && !isAdmin && isOnAdminRoute) {
		return Response.redirect(new URL("/articles", nextUrl));
	}
});

export const config = {
	matcher: ["/articles/:path*", "/users/:path*", "/login", "/register"],
};
