export interface IReportRepository {
  getAppTotals(userId: number, date: string, tz: string): Promise<any[]>;
  getDomainTotals(userId: number, date: string, tz: string): Promise<any[]>;
}

export interface IReportService {
  getAppsReport(userId: number, date: string, tz: string): Promise<any>;
  getUrlsReport(userId: number, date: string, tz: string): Promise<any>;
}
