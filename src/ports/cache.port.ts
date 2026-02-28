export interface ICachePort {
  setBlacklist(key: string, ttlSeconds: number): Promise<void>

  isBlacklisted(key: string): Promise<boolean>

  setLock(key: string, ttlSeconds: number): Promise<boolean>
}
