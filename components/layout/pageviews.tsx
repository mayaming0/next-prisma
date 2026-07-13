"use client";

import { useState, useEffect } from "react";

interface PageviewsData {
	pageviews: number;
	uniqueVisitors: number;
}

export default function Pageviews() {
	const [data, setData] = useState<PageviewsData | null>(null);

	useEffect(() => {
		fetch("/api/pageviews", { method: "POST" })
			.then((res) => res.json())
			.then((d: PageviewsData) =>
				setData({ pageviews: d.pageviews, uniqueVisitors: d.uniqueVisitors })
			)
			.catch(() => setData({ pageviews: 0, uniqueVisitors: 0 }));
	}, []);

	return (
		<div className="brand-sub">
			独立访客：{data?.uniqueVisitors ?? "-"} · 总访问：{data?.pageviews ?? "-"}
		</div>
	);
}