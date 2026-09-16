import { PrismaClient } from '@prisma/client';
import { CommentEntity, PostRecord, SaveCommentInput } from './comment.types.js';

export class CommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPostById(postId: string): Promise<PostRecord | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
        platform: true,
        externalId: true,
      },
    });

    return post as PostRecord | null;
  }

  async findCommentById(commentId: string): Promise<CommentEntity | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return null;
    }

    return {
      id: comment.id,
      postId: comment.postId,
      externalId: comment.externalId,
      parentId: comment.parentId,
      authorName: comment.authorName,
      body: comment.body,
      platform: comment.platform as CommentEntity['platform'],
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  async upsertComments(postId: string, comments: Array<{ externalId: string; authorName: string; body: string; parentExternalId?: string; platform: CommentEntity['platform']; createdAt: Date }>) {
    const results: CommentEntity[] = [];

    for (const comment of comments) {
      const parentComment = comment.parentExternalId
        ? await this.prisma.comment.findFirst({
            where: {
              postId,
              platform: comment.platform,
              externalId: comment.parentExternalId,
            },
          })
        : null;

      const saved = await this.prisma.comment.upsert({
        where: {
          postId_platform_externalId: {
            postId,
            platform: comment.platform,
            externalId: comment.externalId,
          },
        },
        update: {
          authorName: comment.authorName,
          body: comment.body,
          updatedAt: new Date(),
          parentId: parentComment?.id ?? null,
        },
        create: {
          postId,
          externalId: comment.externalId,
          authorName: comment.authorName,
          body: comment.body,
          platform: comment.platform,
          parentId: parentComment?.id ?? null,
        },
      });

      results.push({
        id: saved.id,
        postId: saved.postId,
        externalId: saved.externalId,
        parentId: saved.parentId,
        authorName: saved.authorName,
        body: saved.body,
        platform: saved.platform as CommentEntity['platform'],
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      });
    }

    return results;
  }

  async saveReply(postId: string, parentCommentId: string, input: SaveCommentInput): Promise<CommentEntity> {
    const saved = await this.prisma.comment.create({
      data: {
        postId,
        externalId: input.externalId,
        parentId: parentCommentId,
        authorName: input.authorName,
        body: input.body,
        platform: input.platform,
      },
    });

    return {
      id: saved.id,
      postId: saved.postId,
      externalId: saved.externalId,
      parentId: saved.parentId,
      authorName: saved.authorName,
      body: saved.body,
      platform: saved.platform as CommentEntity['platform'],
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async findCommentsByPost(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null },
      include: { replies: true },
      orderBy: [{ createdAt: 'desc' }],
    });
  }
}
