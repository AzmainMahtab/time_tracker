import * as defaultPool from './pool.js';
import { AppUsage } from '../../domains/usage.domain.js';
import { IUsageRepository } from '../../ports/usage.port.js';

interface IDatabase {
  query: (text: string, params?: any[]) => Promise<any>;
}


export class UsageRepository implements IUsageRepository {
  // We store the connection here
  private readonly db: IDatabase;

  // If no db is provided, it defaults to the production pool.
  constructor(db: IDatabase = defaultPool) {
    this.db = db;
  }

  async findLatest(userId: number): Promise<any | null> {
    // get the last tracked session for this user to check for merging 
    const query = `
      SELECT * FROM app_usage 
      WHERE user_id = $1 
      ORDER BY end_time DESC 
      LIMIT 1
    `;
    const res = await this.db.query(query, [userId]);
    return res.rows[0] || null;
  }

  async save(usage: AppUsage): Promise<void> {
    // create a new entry in the database 
    const query = `
      INSERT INTO app_usage (user_id, app_name, domain, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await this.db.query(query, [
      usage.userId,
      usage.appName,
      usage.domain,
      usage.startTime,
      usage.endTime
    ]);
  }

  async updateEndTime(id: number, newEndTime: Date): Promise<void> {
    // extend the duration of a session instead of creating a new row ]
    await this.db.query(
      'UPDATE app_usage SET end_time = $1 WHERE id = $2',
      [newEndTime, id]
    );
  }
}
