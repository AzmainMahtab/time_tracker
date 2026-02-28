
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

    // fetch the latest session from postgres to check for merging possibilities 
    const lastSession = await this.repo.findLatest(newUsage.userId);

    // logic to determine if we should merge with the previous record 
    if (lastSession &&
      lastSession.appName === newUsage.appName &&
      lastSession.domain === newUsage.domain) {

      // parse dates to compare the gap between pings 
      const lastEnd = new Date(lastSession.endTime).getTime();
      const nextStart = newUsage.startTime.getTime();

      // calculate the gap in seconds; we allow a 30 second threshold for consecutive sessions
      const gapSeconds = (nextStart - lastEnd) / 1000;

      // if the gap is within the threshold, we update the existing row instead of inserting 
      if (gapSeconds >= 0 && gapSeconds <= 30) {
        // update only the end_time to merge the session 
        return await this.repo.updateEndTime(lastSession.userId, newUsage.endTime);
      }
    }

    // if no match is found or the gap is too large, create a new record 
    // this insertion respects our tstzrange exclusion constraint 
    await this.repo.save(newUsage);
  }
}
