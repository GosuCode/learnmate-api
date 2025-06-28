import { FastifyInstance } from 'fastify';
import userRoutes from './user';
import contentRoutes from './content';
import aiRoutes from './ai';

export default async function registerRoutes(fastify: FastifyInstance) {
  // Register all route modules
  await fastify.register(userRoutes, { prefix: '/api/users' });
  await fastify.register(contentRoutes, { prefix: '/api/content' });
  await fastify.register(aiRoutes, { prefix: '/api/ai' });
} 