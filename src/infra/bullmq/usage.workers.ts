import { Worker, Job } from 'bullmq';
import { connection } from './connection.js';
import { IUsagePort } from '../../ports/usage.port.js';

export class UsageWorker {
  private worker: Worker;

  constructor(private readonly usageService: IUsagePort) {
    //  this worker picks up jobs from redis 
    this.worker = new Worker(
      'usage-queue',
      async (job: Job) => {
        // process the usage payload using our service logic 
        await this.usageService.processUsage(job.data);
      },
      { connection }
    );

    this.worker.on('failed', (job, err) => {
      // handle crash recovery by logging failed jobs 
      console.error(`job ${job?.id} failed: ${err.message}`);
    });
  }
}
