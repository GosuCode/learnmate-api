import { FastifyInstance } from 'fastify';
import userRoutes from './user';

export default async function registerRoutes(fastify: FastifyInstance) {
  // Register only user route module
  await fastify.register(userRoutes, { prefix: '/api/users' });
} 