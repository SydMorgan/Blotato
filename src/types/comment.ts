import type { SocialPlatformType } from './social-platform.js';

export interface CommentEntity {
  id: string;
  postId: string;
  externalId: string;
  parentId?: string | null;
  authorName: string;
  body: string;
  platform: SocialPlatformType;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveCommentInput {
  postId: string;
  externalId: string;
  authorName: string;
  body: string;
  platform: SocialPlatformType;
  parentId?: string | null;
}
