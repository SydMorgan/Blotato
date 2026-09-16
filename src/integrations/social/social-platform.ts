export interface SocialComment {
  externalId: string;
  authorName: string;
  body: string;
  parentExternalId?: string;
  createdAt: Date;
}

export interface SocialPlatform {
  readonly platform: string;
  getComments(postExternalId: string): Promise<SocialComment[]>;
  replyToComment(postExternalId: string, commentExternalId: string, body: string): Promise<SocialComment>;
}
