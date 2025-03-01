import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async setToken(
    userId: number,
    token: string,
    ttl: number = 86400,
  ): Promise<void> {
    await this.redis.set(`token:${userId}`, token, 'EX', ttl); // 1 day
  }

  async getToken(userId: number): Promise<string | null> {
    return this.redis.get(`token:${userId}`);
  }

  async deleteToken(userId: number): Promise<void> {
    await this.redis.del(`token:${userId}`);
  }
}
