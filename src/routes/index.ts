import { FastifyInstance } from 'fastify';
import userRoutes from './userRoute';
import authRoutes from './authRoute';

export default async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(userRoutes, { prefix: '/api/users' });
  await fastify.register(authRoutes, { prefix: '/api/auth' });
} 