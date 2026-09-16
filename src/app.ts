import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { SocialPlatformFactory } from './integrations/social/social-platform.factory.js';
import { CommentRepository } from './modules/comments/comment.repository.js';
import { CommentService } from './modules/comments/comment.service.js';
import { CommentController } from './modules/comments/comment.controller.js';
import { createCommentRoutes } from './modules/comments/comment.routes.js';

export function createApp(prisma: PrismaClient) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const publicDir = fileURLToPath(new URL('../public', import.meta.url));
  app.get('/', (_req, res) => {
    res.sendFile(`${publicDir}/index.html`);
  });
  app.use(express.static(publicDir));

  const platformFactory = new SocialPlatformFactory();
  const repository = new CommentRepository(prisma);
  const service = new CommentService(repository, platformFactory);
  const controller = new CommentController(service);

  app.get('/api/meta', (_req, res) => {
    res.json({
      name: 'Blotato comments API',
      version: '1.0.0',
      status: 'ok',
      endpoints: {
        health: '/health',
        users: '/api/users',
        posts: '/api/posts',
        comments: '/api/posts/:postId/comments',
        reply: '/api/posts/:postId/comments/:commentId/replies',
      },
    });
  });

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'connected' });
    } catch {
      res.status(500).json({ status: 'error', database: 'disconnected' });
    }
  });

  app.get('/api/users', async (_req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: { posts: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const { name } = req.body ?? {};
      const user = await prisma.user.create({
        data: {
          name: name?.trim() || `User ${Date.now().toString().slice(-4)}`,
        },
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.comment.deleteMany({
        where: {
          post: { userId: id },
        },
      });
      await prisma.post.deleteMany({ where: { userId: id } });
      const user = await prisma.user.delete({ where: { id } });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/posts', async (_req, res) => {
    try {
      const posts = await prisma.post.findMany({
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
            include: { replies: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/posts', async (req, res) => {
    try {
      const { userId, platform, externalId } = req.body ?? {};
      if (!userId || !platform || !externalId) {
        return res.status(400).json({ error: 'userId, platform, and externalId are required' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const post = await prisma.post.create({
        data: {
          userId,
          platform,
          externalId,
        },
      });

      return res.status(201).json(post);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return res.status(409).json({ error: 'A post with this platform and external ID already exists.' });
      }
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.comment.deleteMany({ where: { postId: id } });
      const post = await prisma.post.delete({ where: { id } });
      res.json(post);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
      const postId = req.params.postId;
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const comments = await prisma.comment.findMany({
        where: { postId, parentId: null },
        include: { replies: true },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(comments);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/posts/:postId/comments', async (req, res) => {
    try {
      const { postId } = req.params;
      const { authorName, body, platform, externalId } = req.body ?? {};
      if (!authorName || !body || !platform || !externalId) {
        return res.status(400).json({ error: 'authorName, body, platform, and externalId are required' });
      }

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.platform !== platform) {
        return res.status(409).json({
          error: `This comment platform must match the post platform. Post is on ${post.platform}, not ${platform}.`,
        });
      }

      const comment = await prisma.comment.create({
        data: {
          postId,
          platform,
          externalId,
          authorName,
          body,
        },
      });

      return res.status(201).json(comment);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return res.status(409).json({ error: 'A comment with this platform and external ID already exists on this post.' });
      }
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/posts/:postId/comments/:commentId/replies', async (req, res) => {
    try {
      const { postId, commentId } = req.params;
      const { body, authorName = 'Blotato', platform } = req.body ?? {};
      if (!body || !platform) {
        return res.status(400).json({ error: 'body and platform are required' });
      }

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const comment = await prisma.comment.findUnique({ where: { id: commentId } });
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (post.platform !== platform || comment.platform !== platform) {
        return res.status(409).json({
          error: `Replies must stay on the same platform as the parent post and comment (${post.platform}).`,
        });
      }

      const reply = await prisma.comment.create({
        data: {
          postId,
          platform,
          externalId: `reply-${Date.now()}`,
          authorName,
          body,
          parentId: commentId,
        },
      });

      return res.status(201).json(reply);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/comments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.comment.deleteMany({ where: { parentId: id } });
      const comment = await prisma.comment.delete({ where: { id } });
      res.json(comment);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.use('/v1', createCommentRoutes(controller));

  return app;
}
