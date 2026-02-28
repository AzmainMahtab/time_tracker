import { IReportRepository } from '../../ports/report.port.js';
import * as defaultPool from './pool.js';


interface IDatabase {
  query: (text: string, params?: any[]) => Promise<any>;
}


export class PostgresReportRepository implements IReportRepository {
  private readonly db: IDatabase;

  // If no db is provided, it defaults to the production pool.
  constructor(db: IDatabase = defaultPool) {
    this.db = db;
  }

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
