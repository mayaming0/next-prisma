import { redis } from "@/lib/redis";
import { NextRequest } from "next/server";

// 从请求头获取客户端真实 IP
function getClientIP(req: NextRequest): string {
	const forwarded = req.headers.get("x-forwarded-for");
	if (forwarded) {
		// x-forwarded-for 可能是 "ip1, ip2, ip3"，取第一个（最原始的客户端 IP）
		return forwarded.split(",")[0].trim();
	}
	const realIP = req.headers.get("x-real-ip");
	if (realIP) return realIP.trim();
	// 本地开发回退
	return "127.0.0.1";
}

// 生成今日日期后缀，用于按天分 key（如 "2026-07-12"）
function getTodayKeySuffix(): string {
	const now = new Date();
	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

// TTL：48 小时（单位：秒），保留 2 天数据便于排查，过期后自动清理
const TTL_SECONDS = 48 * 60 * 60;

export async function POST(req: NextRequest) {
	const ip = getClientIP(req);
	const suffix = getTodayKeySuffix();
	const pageviewsKey = `pageviews:${suffix}`;
	const uniqueIpsKey = `unique_ips:${suffix}`;

	// pipeline 批量执行：
	// 1. 总访问次数 +1
	// 2. 将 IP 加入独立访客集合（自动去重）
	// 3. 给计数器设置 48h 过期（每天 key 不同，旧数据自动清理）
	const [pageviews, added] = await redis
		.pipeline()
		.incr(pageviewsKey)
		.sadd(uniqueIpsKey, ip)
		.expire(pageviewsKey, TTL_SECONDS)
		.expire(uniqueIpsKey, TTL_SECONDS)
		.exec();

	// added === 1 表示新访客，0 表示该 IP 已存在
	const uniqueVisitors = await redis.scard(uniqueIpsKey);

	return Response.json({
		pageviews: pageviews || 0,
		uniqueVisitors: uniqueVisitors || 0,
		isNewVisitor: added === 1,
	});
}

export async function GET() {
	const suffix = getTodayKeySuffix();
	const pageviewsKey = `pageviews:${suffix}`;
	const uniqueIpsKey = `unique_ips:${suffix}`;

	const [pageviews, uniqueVisitors] = await redis
		.pipeline()
		.get(pageviewsKey)
		.scard(uniqueIpsKey)
		.exec();

	return Response.json({
		pageviews: Number(pageviews) || 0,
		uniqueVisitors: Number(uniqueVisitors) || 0,
	});
}