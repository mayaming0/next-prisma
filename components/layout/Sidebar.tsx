"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navItems = [
	{
		section: "内容",
		adminOnly: false,
		links: [
			{
				href: "/articles",
				label: "文章列表",
				icon: (
					<svg
						className="nav-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
						<polyline points="14 2 14 8 20 8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
						<polyline points="10 9 9 9 8 9" />
					</svg>
				),
			},
		],
	},
	{
		section: "管理",
		adminOnly: true,
		links: [
			{
				href: "/articles/new",
				label: "发布文章",
				icon: (
					<svg
						className="nav-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
				),
			},
			{
				href: "/users",
				label: "用户管理",
				icon: (
					<svg
						className="nav-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
						<path d="M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
				),
			},
		],
	},
];

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session } = useSession();

	const isAdmin = session?.user?.role === "ADMIN";

	const isActive = (href: string) => {
		if (href === "/articles") {
			return (
				pathname.startsWith("/articles") &&
				!pathname.startsWith("/articles/new")
			);
		}
		return pathname.startsWith(href);
	};

	const handleLogout = async () => {
		await signOut({ redirect: false });
		router.push("/login");
	};

	return (
		<>
			<div
				className={`sidebar-overlay ${isOpen ? "active" : ""}`}
				onClick={onClose}
			/>
			<aside className={`sidebar ${isOpen ? "open" : ""}`}>
				<div className="sidebar-brand">
					<h2>Golden Blog</h2>
					<div className="brand-sub">Maked By ZeQiang Fu</div>
				</div>

				<nav className="sidebar-nav">
					{navItems.map((section) => {
						if (section.adminOnly && !isAdmin) return null;

						return (
							<div
								key={section.section}
								className={`sidebar-section ${section.adminOnly ? "admin-only" : ""}`}
							>
								<div className="sidebar-section-label">
									{section.section}
								</div>
								{section.links.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										className={`sidebar-link ${isActive(link.href) ? "active" : ""}`}
										onClick={onClose}
									>
										{link.icon}
										{link.label}
									</Link>
								))}
							</div>
						);
					})}
				</nav>

				<div className="sidebar-footer">
					<div className="sidebar-user">
						<div className="sidebar-avatar">
							{session?.user?.username?.charAt(0).toUpperCase() ||
								"?"}
						</div>
						<div className="sidebar-user-info">
							<div className="user-name">
								{session?.user?.username || "未登录"}
							</div>
							<div className="user-role">
								{isAdmin ? "管理员" : "用户"}
							</div>
						</div>
					</div>
					<button
						className="btn btn-ghost btn-sm"
						style={{
							marginTop: "12px",
							padding: "6px 12px",
							fontSize: "0.75rem",
							width: "100%",
							justifyContent: "center",
						}}
						onClick={handleLogout}
					>
						退出登录
					</button>
				</div>
			</aside>
		</>
	);
}
