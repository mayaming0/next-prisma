"use client";

import { useState, useEffect } from "react";
import ArticleCard from "./ArticleCard";
import type { Article } from "@/lib/types";

interface ArticleGridProps {
	articles: Article[];
	isAdmin?: boolean;
	onDelete?: (id: string) => void;
}

export default function ArticleGrid({
	articles,
	isAdmin = true,
	onDelete,
}: ArticleGridProps) {
	const [articleList, setArticleList] = useState(articles);

	useEffect(() => {
		setArticleList(articles);
	}, [articles]);

	const handleDelete = async (id: string) => {
		if (!onDelete) return;
		onDelete(id);
	};

	return (
		<div className="articles-grid">
			{articleList.map((article) => (
				<ArticleCard
					key={article.id}
					article={article}
					isAdmin={isAdmin}
					onDelete={handleDelete}
				/>
			))}
		</div>
	);
}
