import { Request, Response } from 'express';
import { CommentService } from './comment.service.js';

export class CommentController {
  constructor(private readonly service: CommentService) {}

  getComments = async (req: Request, res: Response) => {
    try {
      const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
      const comments = await this.service.getComments(postId);
      return res.json({ data: comments });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  replyToComment = async (req: Request, res: Response) => {
    try {
      const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
      const commentId = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
      const { body } = req.body;
      const reply = await this.service.replyToComment(postId, commentId, body);
      return res.status(201).json({ data: reply });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };
}
