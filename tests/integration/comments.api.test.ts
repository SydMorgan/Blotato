import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app.js';

describe('App metadata', () => {
  it('returns API metadata via the metadata endpoint', async () => {
    const app = createApp({ $queryRaw: async () => [{ '?column?': 1 }] } as any);

    const res = await request(app).get('/api/meta');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Blotato comments API');
  });
});

const shouldRunDbTests = !!process.env.DATABASE_URL;
describe.runIf(shouldRunDbTests)('Comments API', () => {
  const prisma = new PrismaClient();
  const app = createApp(prisma);
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: 'user-1',
      },
    });

    await prisma.post.create({
      data: {
        id: 'post-1',
        userId: 'user-1',
        platform: 'INSTAGRAM',
        externalId: 'ext-post-1',
      },
    });
  });

  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('health endpoint works', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('gets comments for a valid post', async () => {
    const res = await request(app).get('/v1/posts/post-1/comments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('creates a reply to a comment', async () => {
    await prisma.comment.create({
      data: {
        id: 'comment-1',
        postId: 'post-1',
        externalId: 'ext-comment-1',
        authorName: 'Jane',
        body: 'Hey there',
        platform: 'INSTAGRAM',
      },
    });

    const res = await request(app)
      .post('/v1/posts/post-1/comments/comment-1/replies')
      .send({ body: 'Thanks for the note!' });

    expect(res.status).toBe(201);
    expect(res.body.data.body).toBe('Thanks for the note!');
  });
});
