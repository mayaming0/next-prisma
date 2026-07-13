import { Redis } from "@upstash/redis";

// 写法一：fromEnv（推荐）
export const redis = Redis.fromEnv();

// 写法二：手动传入

// export const redis = new Redis({
// 	url: process.env.UPSTASH_REDIS_REST_URL!,
// 	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });
