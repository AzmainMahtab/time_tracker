import { IReportService, IReportRepository } from '../ports/report.port.js';

export class ReportService implements IReportService {
  constructor(private readonly repo: IReportRepository) { }

  async getAppsReport(userId: number, date: string, tz: string) {
    const data = await this.repo.getAppTotals(userId, date, tz);
    return this.formatResponse(data, 'apps', 'app_name');
  }

  async getUrlsReport(userId: number, date: string, tz: string) {
    const data = await this.repo.getDomainTotals(userId, date, tz);
    return this.formatResponse(data, 'urls', 'url');
  }

  private formatResponse(rows: any[], listKey: string, nameKey: string) {
    let totalSeconds = 0;
    const items = rows.map(row => {
      const seconds = this.intervalToSeconds(row.duration);
      totalSeconds += seconds;
      return {
        [nameKey]: row[nameKey],
        duration: this.secondsToHms(seconds)
      };
    });

    return {
      total_time: this.secondsToHms(totalSeconds),
      [listKey]: items
    };
  }

  private intervalToSeconds(interval: any): number {
    return (interval.hours || 0) * 3600 + (interval.minutes || 0) * 60 + (interval.seconds || 0);
  }

  private secondsToHms(sec: number): string {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}
