import * as defaultClient from './client.js'
import { ICachePort } from '../../ports/cache.port.js'

// Interface to accept both the main client and potential transaction clients
interface IRedisConnection {
  set: (key: string, value: string, options?: any) => Promise<any>
  get: (key: string) => Promise<string | null>
}

export class RedisCacheRepository implements ICachePort {
  private readonly redis: IRedisConnection

  constructor(redis: IRedisConnection = defaultClient.client) {
    this.redis = redis
  }

  async setBlacklist(key: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(`bl:${key}`, '1', { EX: ttlSeconds })
  }

  async isBlacklisted(key: string): Promise<boolean> {
    const result = await this.redis.get(`bl:${key}`)
    return result === '1'
  }

  async setLock(key: string, ttlSeconds: number): Promise<boolean> {
    /**
     * Prevent simultaneous refresh attacks 
     * NX: true ensures the lock is only set if it doesn't already exist
     */
    const result = await this.redis.set(`lock:${key}`, '1', {
      NX: true,
      EX: ttlSeconds
    })
    return result === 'OK'
  }
}
