import { z } from 'zod';

export const replySchema = z.object({
  body: z.string().min(1).max(5000),
});

export const commentQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  cursor: z.string().optional(),
});
