import { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';
import { env } from './config/env.js';

const prisma = new PrismaClient();
const app = createApp(prisma);

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Blotato comments API listening on http://0.0.0.0:${env.port}`);
});
