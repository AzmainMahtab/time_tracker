import { Request, Response } from 'express';
import { IReportService } from '../../../ports/report.port.js';

export class ReportController {
  constructor(private readonly reportService: IReportService) { }

  getApps = async (req: Request, res: Response) => {
    const { user_id, date, tz } = req.query;
    const report = await this.reportService.getAppsReport(
      Number(user_id),
      date as string,
      (tz as string) || 'UTC'
    );
    res.json(report);
  }

  getUrls = async (req: Request, res: Response) => {
    const { user_id, date, tz } = req.query;
    const report = await this.reportService.getUrlsReport(
      Number(user_id),
      date as string,
      (tz as string) || 'UTC'
    );
    res.json(report);
  }
}
