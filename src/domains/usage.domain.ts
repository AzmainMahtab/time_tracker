export class AppUsage {
  readonly userId: number;
  readonly appName: string;
  readonly url?: string;
  readonly domain?: string;
  readonly startTime: Date;
  readonly endTime: Date;

  constructor(props: Partial<AppUsage>) {
    this.userId = props.userId!;
    this.appName = props.appName!;
    this.url = props.url;
    // extract domain and remove www for normalization 
    this.domain = props.url ? this.normalizeUrl(props.url) : undefined;
    this.startTime = props.startTime!;
    this.endTime = props.endTime!;
  }

  private normalizeUrl(url: string): string {
    try {
      // parse the url to extract only the hostname 
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch (e) {
      // fallback if url is bad
      return url;
    }
  }
}
