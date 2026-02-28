import { Queue, Worker, Job } from 'bullmq';
import { config } from '../../config/env.js';

// use the redis config you already have
export const connection = {
  host: config.redis.host,
  port: config.redis.port,
};

export const usageQueue = new Queue('usage-queue', { connection });
