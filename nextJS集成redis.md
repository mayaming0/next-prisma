## redis 技术选型

- @upstash/redis是 Upstash 提供的 Serverless Redis HTTP 客户端 npm 包，专为 Next.js / Vercel / Cloudflare Workers 等无持久 TCP 连接的 Serverless 环境设计;
- ioredis 是 Node.js 的 Redis 客户端，支持持久 TCP 连接，但需要自行处理 Redis 连接的创建、重连、关闭等逻辑，且在 Serverless 环境中表现不佳。

## @upstash/redis 环境配置

1. 打开 https://console.upstash.com/ 注册免费账号
2. npm install @upstash/redis
3. 配置环境变量

```
// .env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
// 踩坑：服务端与客户端 获取环境变量方式不同，服务端可以读取所有环境变量，客户端只能读取 NEXT_PUBLIC_ 前缀的环境变量
```

4. 创建 Redis 客户端

```js
import { Redis } from "@upstash/redis";

// 写法一：fromEnv（推荐）
export const redis = Redis.fromEnv();

// 写法二：手动传入

// export const redis = new Redis({
// 	url: process.env.UPSTASH_REDIS_REST_URL!,
// 	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });
```

5. 使用 Redis 客户端

```js
import { redis } from "@/lib/redis";
const visits = await redis.incr("page:visits");
```

## 常用API

Redis 中文命令参考 | http://www.redis.cn/commands.html

## 通用键（Key）命令

| 命令   | 语法                                        | 示例                            | 说明                                                  | 使用场景                               |
| ------ | ------------------------------------------- | ------------------------------- | ----------------------------------------------------- | -------------------------------------- |
| DEL    | `DEL key [key ...]`                         | `DEL user:1 session:abc`        | 删除一个或多个 Key，返回删除数量                      | 手动清理缓存、注销用户数据             |
| EXISTS | `EXISTS key [key ...]`                      | `EXISTS token:xxx`              | 判断 Key 是否存在，返回存在的数量                     | 防重复提交校验、判断缓存是否命中       |
| EXPIRE | `EXPIRE key seconds`                        | `EXPIRE verify:code 300`        | 设置 Key 的生存时间（秒）                             | 验证码、登录 Token、临时会话           |
| TTL    | `TTL key`                                   | `TTL verify:code`               | 查看剩余存活时间（秒），-1 永不过期，-2 已过期/不存在 | 调试过期策略                           |
| SCAN   | `SCAN cursor [MATCH pattern] [COUNT count]` | `SCAN 0 MATCH user:* COUNT 100` | 渐进式遍历 Key，无阻塞                                | 生产环境禁用 KEYS \*，必须用 SCAN 代替 |

## String（字符串）

| 命令        | 语法                                                    | 示例                              | 说明                                | 使用场景                      |
| ----------- | ------------------------------------------------------- | --------------------------------- | ----------------------------------- | ----------------------------- |
| SET         | `SET key value [EX seconds]`                            | `SET username "zhangsan" EX 3600` | 设置值并可附带过期时间              | 缓存用户信息、配置项、Session |
| GET         | `GET key`                                               | `GET username`                    | 获取值，不存在返回 nil              | 读取缓存                      |
| INCR / DECR | `INCR key` / `DECR key`                                 | `INCR article:views:1001`         | 整数原子自增/自减 1，值非整数会报错 | 文章阅读量、点赞数、库存扣减  |
| MSET / MGET | `MSET key value [key value ...]` / `MGET key [key ...]` | `MSET k1 v1 k2 v2` / `MGET k1 k2` | 批量设置/获取，减少网络往返         | 首页多模块数据一次性拉取      |

## Hash（哈希）

| 命令    | 语法                                     | 示例                                 | 说明                                     | 使用场景                                      |
| ------- | ---------------------------------------- | ------------------------------------ | ---------------------------------------- | --------------------------------------------- |
| HSET    | `HSET key field value [field value ...]` | `HSET user:1001 name "Alice" age 28` | 设置哈希表字段                           | 存储用户资料、商品属性，避免整体序列化大 JSON |
| HGET    | `HGET key field`                         | `HGET user:1001 name`                | 获取单个字段值                           | 只取用户昵称，不加载全部信息                  |
| HGETALL | `HGETALL key`                            | `HGETALL user:1001`                  | 获取所有字段和值（大对象慎用，可能阻塞） | 详情页全量展示                                |
| HINCRBY | `HINCRBY key field increment`            | `HINCRBY user:1001 score 10`         | 哈希内字段自增                           | 用户积分、购物车商品数量变更                  |

## List（列表）

| 命令          | 语法                                                          | 示例                                             | 说明                       | 使用场景                            |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------ | -------------------------- | ----------------------------------- |
| LPUSH / RPUSH | `LPUSH key value [value ...]` / `RPUSH key value [value ...]` | `LPUSH msg:queue "task1"` / `RPUSH logs "line1"` | 左（头）/右（尾）插入元素  | 消息队列生产者（LPUSH）、时间线记录 |
| LPOP / RPOP   | `LPOP key` / `RPOP key`                                       | `RPOP msg:queue`                                 | 左/右弹出元素              | 消息队列消费者、栈（LPUSH+LPOP）    |
| LRANGE        | `LRANGE key start stop`                                       | `LRANGE msg:queue 0 -1`（-1 表示末尾）           | 获取指定区间元素           | 分页查看最新评论、最新 N 条动态     |
| BLPOP / BRPOP | `BLPOP key timeout` / `BRPOP key timeout`                     | `BRPOP msg:queue 30`（阻塞 30 秒）               | 阻塞式弹出，队列为空时等待 | 长轮询任务队列，避免空转轮询        |

## Set（集合）

| 命令                    | 语法                                                        | 示例                                | 说明                         | 使用场景                 |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------- | ---------------------------- | ------------------------ |
| SADD                    | `SADD key member [member ...]`                              | `SADD article:1001:likes uid1 uid2` | 添加成员，重复添加无效       | 文章点赞用户、标签去重   |
| SMEMBERS                | `SMEMBERS key`                                              | `SMEMBERS article:1001:likes`       | 返回所有成员（大集合慎用）   | 小体量标签全量展示       |
| SISMEMBER               | `SISMEMBER key member`                                      | `SISMEMBER article:1001:likes uid1` | 判断是否存在                 | 快速判断"我是否已点赞"   |
| SINTER / SUNION / SDIFF | `SINTER key1 key2` / `SUNION key1 key2` / `SDIFF key1 key2` | `SINTER follow:A follow:B`          | 交集 / 并集 / 差集           | 共同好友、推荐未关注的人 |
| SPOP                    | `SPOP key [count]`                                          | `SPOP lottery 1`                    | 随机弹出（删除）指定数量成员 | 抽奖系统                 |

## ZSet（有序集合）

| 命令      | 语法                                       | 示例                                         | 说明                         | 使用场景             |
| --------- | ------------------------------------------ | -------------------------------------------- | ---------------------------- | -------------------- |
| ZADD      | `ZADD key score member [score member ...]` | `ZADD leaderboard 95 "PlayerA" 87 "PlayerB"` | 添加带分数的成员             | 游戏排行榜、热度排序 |
| ZREVRANGE | `ZREVRANGE key start stop [WITHSCORES]`    | `ZREVRANGE leaderboard 0 9 WITHSCORES`       | 倒序取 Top N（分数从高到低） | 排行榜前 10 名查询   |
| ZINCRBY   | `ZINCRBY key increment member`             | `ZINCRBY leaderboard 5 "PlayerA"`            | 给成员分数自增               | 实时更新玩家得分     |

---
