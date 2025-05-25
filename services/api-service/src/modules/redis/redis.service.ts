import { env } from "@environments";
import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class RedisService {
    private redis: Redis;
    constructor() {
        this.redis = new Redis(env.redis.URL, { keyPrefix: `${env.redis.GLOBAL_PREFIX || ""}:` });
    }

    /*
    config.ttl: number format in seconds
    */
    async set<T = any>(key: string, object: T | undefined | null, config?: { ttl?: number }) {
        if (config?.ttl) {
            await this.redis.set(key, JSON.stringify(object), "EX", config.ttl);
        } else {
            await this.redis.set(key, JSON.stringify(object));
        }
    }

    async get<T = any>(key: string, defaultValue?: T): Promise<T | undefined | null> {
        const data = await this.redis.get(key);
        return data ? (JSON.parse(data) as T) : defaultValue;
    }

    async del(key: string): Promise<boolean> {
        const res = await this.redis.del(key);
        return res == 1;
    }

    async iget<T = any, Z extends string | number = string | number>(
        key: string,
        id: Z,
        defaultValue?: T,
        config: { hasTTL: boolean } = { hasTTL: false }
    ): Promise<T | undefined | null> {
        if (config.hasTTL) return await this.get(`${key}:${id}`, defaultValue);
        const data = await this.redis.hget(key, id.toString());
        return data ? (JSON.parse(data) as T) : defaultValue;
    }

    async iset<T = any, Z extends string | number = string | number>(key: string, id: Z, object: T | undefined | null, config?: { ttl?: number }) {
        if (config?.ttl) {
            return await this.set(`${key}:${id}`, object, config);
        }
        return await this.redis.hset(key, id, JSON.stringify(object));
    }

    async hGet<T = any>(key: string, id: string, defaultValue?: T): Promise<T | undefined | null> {
        const data = await this.redis.hget(key, id);
        return data ? (JSON.parse(data) as T) : defaultValue;
    }

    // eslint-disable-next-line
    async hGetAll<T = any>(key: string, defaultValue?: T): Promise<any> {
        return this.redis.hgetall(key);
    }

    async hSet<T = any>(key: string, id: string, object: T | undefined | null, ttlInSecond?: number): Promise<boolean> {
        let success = true;
        const chain = this.redis.multi().hset(key, id, JSON.stringify(object));

        if (ttlInSecond) {
            chain.expire(key, ttlInSecond);
        }

        await chain.exec().catch((err) => {
            success = false;
            console.log("hSet error", err);
        });

        return success;
    }

    async hmSet(key: string, object: object, ttlInSecond?: number): Promise<boolean> {
        let success = true;
        const chain = this.redis.multi().hmset(key, object);

        if (ttlInSecond) {
            chain.expire(key, ttlInSecond);
        }

        await chain.exec().catch((err) => {
            success = false;
            console.log("mSet error", err);
        });

        return success;
    }

    async lPush<T = any>(key: string, object: T | undefined | null, ttlInSecond?: number): Promise<boolean> {
        let success = true;
        const chain = this.redis.multi().lpush(key, JSON.stringify(object));

        if (ttlInSecond) {
            chain.expire(key, ttlInSecond);
        }

        await chain.exec().catch((err) => {
            success = false;
            console.log("lPush error", err);
        });

        return success;
    }

    async rPush<T = any>(key: string, object: T | undefined | null, ttlInSecond?: number): Promise<boolean> {
        let success = true;
        const chain = this.redis.multi().rpush(key, JSON.stringify(object));

        if (ttlInSecond) {
            chain.expire(key, ttlInSecond);
        }

        await chain.exec().catch((err) => {
            success = false;
            console.log("rPush error", err);
        });

        return success;
    }

    async lTrim(key: string, start: number, stop: number): Promise<boolean> {
        let success = true;
        await this.redis.ltrim(key, start, stop).catch((err) => {
            success = false;
            console.log("lTrim error", err);
        });
        return success;
    }

    async lRange<T = any>(key: string, start: number, end: number): Promise<T[]> {
        const data = await this.redis.lrange(key, start, end);
        return data.map((v) => JSON.parse(v));
    }

    async lRem<T = any>(key: string, object: T | undefined | null): Promise<boolean> {
        let success = true;
        await this.redis
            .multi()
            .lrem(key, 0, JSON.stringify(object))
            .exec()
            .catch((err) => {
                success = false;
                console.log("lRem error", err);
            });

        return success;
    }

    async incrBy(key: string, increment: number) {
        return this.redis.incrby(key, increment);
    }

    async try<A, T = A>(key: string, config: { ttl: number } = { ttl: 600 }, f: () => Promise<A>) {
        let data = await this.get<T>(key);
        if (!data) {
            data = (await f()) as any;
            if (data) await this.set(key, data, config);
        }
        return data as T;
    }

    async itry<A, T = A, Z extends string | number = string | number>(key: string, id: Z, f: (id: Z) => Promise<A>, config?: { ttl?: number }) {
        let data = await this.iget<T>(key, id, undefined, {
            hasTTL: Boolean(config?.ttl)
        });

        if (!data) {
            data = (await f(id)) as any;
            if (data) await this.iset(key, id, data, config);
        }
        return data as T;
    }

    async lock(key: string, ttlInSecond: number = 20): Promise<boolean> {
        const lockKey = await this.getLockKey(key);

        let success = false;
        await this.redis
            .multi()
            .setnx(lockKey, lockKey)
            .expire(lockKey, ttlInSecond)
            .exec((err, results) => {
                if (err) {
                    return;
                }

                success = results![0][1]! == 1;
            });

        return success;
    }

    async keys(pattern: string): Promise<string[]> {
        return this.redis.keys(pattern);
    }

    async deleteByPattern(pattern: string): Promise<void> {
        const keys = await this.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }

    async unlock(key: string): Promise<boolean> {
        const lockKey = await this.getLockKey(key);
        const res = await this.redis.del(lockKey);
        if (res == 1) {
            return true;
        }

        return false;
    }

    async getLockKey(key: string): Promise<string> {
        return `cache:lock:${key}`;
    }

    async zadd(key: string, score: number, member: string, config: { ttl: number } = { ttl: 600 }): Promise<number> {
        const chain = this.redis.multi().zadd(key, score, member);

        if (config.ttl) {
            chain.expire(key, config.ttl);
        }

        return this.redis.zadd(key, score, member);
    }

    async zincrby(key: string, score: number, member: string): Promise<string> {
        return this.redis.zincrby(key, score, member);
    }

    async zrevrange(key: string, start: number, stop: number, withScores: boolean = false): Promise<string[] | Array<{ member: string; score: number }>> {
        const result = await this.redis.zrevrange(key, start, stop, withScores ? "WITHSCORES" : undefined);

        if (!withScores) {
            return result; // Trả về string[] khi withScores = false
        }

        // Khi withScores = true, định dạng kết quả thành Array<{ member: string; score: number }>
        const formattedResult: Array<{ member: string; score: number }> = [];
        for (let i = 0; i < result.length; i += 2) {
            formattedResult.push({
                member: result[i],
                score: parseFloat(result[i + 1] || "0"), // Đảm bảo score là số, xử lý trường hợp undefined
            });
        }
        return formattedResult;
    }

    async zrevrank(key: string, member: string): Promise<number | null> {
        const rank = await this.redis.zrevrank(key, member);
        return rank !== null ? rank : null;
    }

    // New method to get a member's score in a sorted set
    async zscore(key: string, member: string): Promise<number | null> {
        const score = await this.redis.zscore(key, member);
        return score !== null ? parseFloat(score) : null;
    }

    async zCard(key: string): Promise<number> {
        return this.redis.zcard(key);
    }

    async zRange(key: string, start: number, end: number): Promise<string[]> {
        return this.redis.zrange(key, start, end);
    }

    async zRem(key: string, member: string): Promise<number> {
        return this.redis.zrem(key, member);
    }

    async zRevRange(key: string, start: number, end: number): Promise<string[]> {
        return this.redis.zrevrange(key, start, end);
    }

    async hDel(key: string, field: string): Promise<number> {
        return this.redis.hdel(key, field);
    }

    async zAdd(key: string, score: number, member: string): Promise<number> {
        return this.redis.zadd(key, score, member);
    }

    async expire(key: string, ttl: number): Promise<number> {
        return this.redis.expire(key, ttl);
    }

    async zScore(key: string, member: string): Promise<string> {
        return this.redis.zscore(key, member);
    }

    async zRangeWithScores(key: string, start: number, end: number): Promise<Array<{ member: string; score: number }>> {
        const result = await this.redis.zrange(key, start, end, "WITHSCORES");
        const formattedResult = [];
        for (let i = 0; i < result.length; i += 2) {
            formattedResult.push({
                member: result[i],
                score: parseFloat(result[i + 1])
            });
        }
        return formattedResult;
    }

    async hMGet(key: string, fields: string[]): Promise<string[]> {
        return this.redis.hmget(key, ...fields);
    }

    pipeline() {
        return this.redis.pipeline();
    }
}
