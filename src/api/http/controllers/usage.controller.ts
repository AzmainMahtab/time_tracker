import { Request, Response } from 'express';
import { usageQueue } from '../../../infra/bullmq/connection.js';

export class UsageController {
  async trackUsage(req: Request, res: Response) {
    try {
      // push the raw payload to the queue for background processing 
      await usageQueue.add('process-ping', req.body, {
        attempts: 3, // retry 3 times on failure for crash recovery 
        backoff: 1000,
      });

      // return 202 accepted as the data is being processed 
      return res.status(202).json({ status: 'queued' });
    } catch (error) {
      return res.status(500).json({ error: 'failed to queue usage' });
    }
  }
}
