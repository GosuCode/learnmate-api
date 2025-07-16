import { FastifyInstance } from 'fastify';
import userRoutes from './userRoute';

export default async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(userRoutes, { prefix: '/api/users' });
} 