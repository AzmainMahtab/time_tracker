import { Pool } from 'pg';
import { IReportRepository } from '../../ports/report.port.js';

export class PostgresReportRepository implements IReportRepository {
  constructor(private readonly db: Pool) { }

  async getAppTotals(userId: number, date: string, tz: string): Promise<any[]> {
    const query = `
      SELECT app_name, SUM(end_time - start_time) as duration
      FROM app_usage
      WHERE user_id = $1 
      AND (start_time AT TIME ZONE $3)::date = $2::date
      GROUP BY app_name
      ORDER BY duration DESC;
    `;
    const res = await this.db.query(query, [userId, date, tz]);
    return res.rows;
  }

  async getDomainTotals(userId: number, date: string, tz: string): Promise<any[]> {
    const query = `
      SELECT domain as url, SUM(end_time - start_time) as duration
      FROM app_usage
      WHERE user_id = $1 
      AND (start_time AT TIME ZONE $3)::date = $2::date
      GROUP BY domain
      ORDER BY duration DESC;
    `;
    const res = await this.db.query(query, [userId, date, tz]);
    return res.rows;
  }
}
