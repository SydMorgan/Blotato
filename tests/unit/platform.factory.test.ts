import { describe, it, expect } from 'vitest';
import { SocialPlatformFactory } from '../../src/integrations/social/social-platform.factory.js';

describe('SocialPlatformFactory', () => {
  it('returns the mock adapter for mock platform', () => {
    const factory = new SocialPlatformFactory();
    const platform = factory.get('MOCK');

    expect(platform).toBeDefined();
    expect(platform.platform).toBe('MOCK');
  });

  it('throws for unsupported platforms', () => {
    const factory = new SocialPlatformFactory();
    expect(() => factory.get('LINKEDIN')).toThrow('Unsupported platform');
  });
});
