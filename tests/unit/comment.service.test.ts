import { describe, it, expect, vi } from 'vitest';
import { CommentService } from '../../src/modules/comments/comment.service.js';
import { SocialPlatformFactory } from '../../src/integrations/social/social-platform.factory.js';

describe('CommentService', () => {
  it('returns comments for a valid post', async () => {
    const repository = {
      findPostById: vi.fn().mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        platform: 'INSTAGRAM',
        externalId: 'ext-post-1',
      }),
      upsertComments: vi.fn().mockResolvedValue([]),
      findCommentsByPost: vi.fn().mockResolvedValue([{ id: 'c-1', body: 'Great post!' }]),
      findCommentById: vi.fn(),
      saveReply: vi.fn(),
    } as any;

    const platformFactory = {
      get: vi.fn().mockReturnValue({
        getComments: vi.fn().mockResolvedValue([
          { externalId: 'c-1', authorName: 'Jane', body: 'Great post!', createdAt: new Date() },
        ]),
        replyToComment: vi.fn(),
      }),
    } as any;

    const service = new CommentService(repository, platformFactory);
    const result = await service.getComments('post-1');

    expect(result).toHaveLength(1);
    expect(repository.upsertComments).toHaveBeenCalled();
  });

  it('throws when post does not exist', async () => {
    const repository = {
      findPostById: vi.fn().mockResolvedValue(null),
    } as any;

    const factory = new SocialPlatformFactory();
    const service = new CommentService(repository, factory);

    await expect(service.getComments('missing')).rejects.toThrow('Post not found');
  });
});
