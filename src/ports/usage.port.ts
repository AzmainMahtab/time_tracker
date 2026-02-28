import { AppUsage } from '../../src/domains/usage.domain.js';

export interface IUsageRepository {
  findLatest(userId: number): Promise<AppUsage | null>;

  save(usage: AppUsage): Promise<void>;

  updateEndTime(id: number, newEndTime: Date): Promise<void>;
}

export interface IUsagePort {
  processUsage(payload: any): Promise<void>;
}
