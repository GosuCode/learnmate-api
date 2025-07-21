import { FastifyInstance } from 'fastify';
import userRoutes from '@/routes/userRoute';
import authRoutes from '@/routes/authRoute';
import contentRoutes from '@/routes/contentRoute';
import courseRoutes from './courseRoutes';
import chapterRoutes from './chapterRoutes';

export default async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(userRoutes, { prefix: '/api/users' });
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(contentRoutes, { prefix: '/api/content' });
  await fastify.register(courseRoutes, { prefix: '/api/course' });
  await fastify.register(chapterRoutes, { prefix: '/api/chapter' });
}