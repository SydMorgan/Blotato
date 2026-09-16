import { SocialComment, SocialPlatform } from './social-platform.js';

export class MockSocialAdapter implements SocialPlatform {
  readonly platform = 'MOCK';

  async getComments(): Promise<SocialComment[]> {
    return [
      {
        externalId: 'comment-1',
        authorName: 'Jane',
        body: 'Great post!',
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      },
    ];
  }

  async replyToComment(_postExternalId: string, commentExternalId: string, body: string): Promise<SocialComment> {
    return {
      externalId: `reply-${Date.now()}`,
      authorName: 'Blotato',
      body,
      parentExternalId: commentExternalId,
      createdAt: new Date(),
    };
  }
}
