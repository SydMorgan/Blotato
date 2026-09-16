import { Router } from 'express';
import { CommentController } from './comment.controller.js';

export function createCommentRoutes(controller: CommentController) {
  const router = Router();

  router.get('/posts/:postId/comments', controller.getComments);
  router.post('/posts/:postId/comments/:commentId/replies', controller.replyToComment);

  return router;
}
