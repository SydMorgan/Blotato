import { PrismaClient } from '@prisma/client';
import { SocialPlatformFactory } from '../../integrations/social/social-platform.factory.js';
import { CommentRepository } from './comment.repository.js';

export class CommentService {
  constructor(
    private readonly repository: CommentRepository,
    private readonly platformFactory: SocialPlatformFactory,
  ) {}

  async getComments(postId: string) {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new Error('Post not found');

    const platform = this.platformFactory.get(post.platform);
    const comments = await platform.getComments(post.externalId);

    await this.repository.upsertComments(post.id, comments.map((comment: {
      externalId: string;
      authorName: string;
      body: string;
      parentExternalId?: string;
      createdAt: Date;
    }) => ({
      externalId: comment.externalId,
      authorName: comment.authorName,
      body: comment.body,
      platform: post.platform,
      parentExternalId: comment.parentExternalId,
      createdAt: comment.createdAt,
    })));

    return this.repository.findCommentsByPost(post.id);
  }

  async replyToComment(postId: string, commentId: string, body: string) {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new Error('Post not found');

    const comment = await this.repository.findCommentById(commentId);
    if (!comment) throw new Error('Comment not found');

    const platform = this.platformFactory.get(post.platform);
    const reply = await platform.replyToComment(post.externalId, comment.externalId, body);

    return this.repository.saveReply(post.id, comment.id, {
      postId: post.id,
      externalId: reply.externalId,
      authorName: reply.authorName,
      body: reply.body,
      platform: post.platform,
      parentId: comment.id,
    });
  }
}
