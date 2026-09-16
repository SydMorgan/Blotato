export const SOCIAL_PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'X', 'FACEBOOK', 'TIKTOK'] as const;

export type SocialPlatformValue = (typeof SOCIAL_PLATFORMS)[number];

export const API_METADATA = Object.freeze({
  name: 'Blotato comments API',
  version: '1.0.0',
  status: 'ok',
});

export const APP_DEFAULTS = Object.freeze({
  userNamePrefix: 'User',
  replyAuthor: 'Blotato',
});
