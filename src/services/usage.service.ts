import { IUsagePort, IUsageRepository } from '../ports/usage.port.js';
import { AppUsage } from '../domains/usage.domain.js';

export class UsageService implements IUsagePort {
  constructor(private readonly repo: IUsageRepository) { }

  async processUsage(payload: any): Promise<void> {
    const newUsage = new AppUsage({
      userId: payload.user_id,
      appName: payload.app_name,
      url: payload.url,
      startTime: new Date(payload.start_time),
      endTime: new Date(payload.end_time)
    });

    const lastSession = await this.repo.findLatest(newUsage.userId);

    if (lastSession) {
      const lastStart = new Date(lastSession.startTime).getTime();
      const lastEnd = new Date(lastSession.endTime).getTime();
      const nextStart = newUsage.startTime.getTime();
      const nextEnd = newUsage.endTime.getTime();

      //  exact duplicate or complete overlap
      // if the new ping starts exactly when the last one did, just update the end time
      if (lastStart === nextStart) {
        if (nextEnd > lastEnd) {
          return await this.repo.updateEndTime(lastSession.id, newUsage.endTime);
        }
        return; //  it is an old or duplicate ping, ignore it
      }

      // consecutive session merging
      if (lastSession.appName === newUsage.appName && lastSession.domain === newUsage.domain) {
        const gapSeconds = (nextStart - lastEnd) / 1000;

        // if gap is 0-30 seconds, extend the session
        if (gapSeconds >= 0 && gapSeconds <= 30) {
          return await this.repo.updateEndTime(lastSession.id, newUsage.endTime);
        }
      }
    }

    // if we reach here, it is a genuinely new, non-overlapping session
    await this.repo.save(newUsage);
  }
}
