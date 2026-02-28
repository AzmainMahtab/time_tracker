import * as defaultPool from './pool.js'
import { Session } from '../../domains/auth.domain.js'
import { ISessionRepository } from '../../ports/session.ports.js'

interface IDatabase {
  query: (text: string, params?: any[]) => Promise<any>
}

export class PostgresSessionRepository implements ISessionRepository {
  private readonly db: IDatabase

  constructor(db: IDatabase = defaultPool) {
    this.db = db
  }

  async save(s: Session): Promise<void> {
    const sql = `
      INSERT INTO sessions (user_id, device_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, device_id) 
      DO UPDATE SET 
        token_hash = EXCLUDED.token_hash, 
        expires_at = EXCLUDED.expires_at, 
        updated_at = NOW();
    `
    await this.db.query(sql, [s.userId, s.deviceId, s.tokenHash, s.expiresAt])
  }

  async findActive(userId: string, deviceId: string): Promise<Session | null> {
    const sql = `
      SELECT 
        uuid, user_id AS "userId", device_id AS "deviceId", 
        token_hash AS "tokenHash", expires_at AS "expiresAt", 
        created_at AS "createdAt"
      FROM sessions 
      WHERE user_id = $1 AND device_id = $2 AND expires_at > NOW();
    `
    const { rows } = await this.db.query(sql, [userId, deviceId])
    if (rows.length === 0) return null
    return new Session(rows[0])
  }

  async delete(userId: string, deviceId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM sessions WHERE user_id = $1 AND device_id = $2',
      [userId, deviceId]
    )
  }

  async deleteAll(userId: string): Promise<void> {
    await this.db.query('DELETE FROM sessions WHERE user_id = $1', [userId])
  }
}
