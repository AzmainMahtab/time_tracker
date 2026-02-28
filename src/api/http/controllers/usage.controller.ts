// src/api/http/controllers/usage.controller.ts

import { Request, Response } from 'express';
import { Queue } from 'bullmq'; // lowercase comments: import the type for the constructor

export class UsageController {
  constructor(private readonly usageQueue: Queue) { }

  trackUsage = async (req: Request, res: Response) => {
    try {
      await this.usageQueue.add('process-ping', req.body, {
        attempts: 3,
        backoff: 1000,
      });

      // 202 accepted
      return res.status(202).json({ status: 'queued' });
    } catch (error) {
      // error if redis or bullmq is unreachable
      return res.status(500).json({ error: 'failed to queue usage' });
    }
  }
}
