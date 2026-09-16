import type { SocialPlatformType } from './social-platform.js';

export interface PostRecord {
  id: string;
  userId: string;
  platform: SocialPlatformType;
  externalId: string;
}
