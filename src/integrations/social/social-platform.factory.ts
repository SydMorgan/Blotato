import { SocialPlatform } from './social-platform.js';
import { MockSocialAdapter } from './mock.adapter.js';

export class SocialPlatformFactory {
  constructor(
    private readonly adapters: Record<string, SocialPlatform> = {
      MOCK: new MockSocialAdapter(),
      INSTAGRAM: new MockSocialAdapter(),
      YOUTUBE: new MockSocialAdapter(),
      X: new MockSocialAdapter(),
      FACEBOOK: new MockSocialAdapter(),
      TIKTOK: new MockSocialAdapter(),
    },
  ) {}

  get(platform: string): SocialPlatform {
    const key = platform?.toUpperCase();
    const adapter = this.adapters[key];
    if (!adapter) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    return adapter;
  }
}
