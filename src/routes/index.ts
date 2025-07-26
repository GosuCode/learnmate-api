import { FastifyInstance } from 'fastify';
import userRoutes from '@/routes/userRoute';
import authRoutes from '@/routes/authRoute';
import healthCheckRoute from './healthcheck.route';
import semesterRoutes from './semesterRoute';

export default async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(userRoutes, { prefix: '/api/users' });
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(semesterRoutes, { prefix: '/api/semester' });
  await fastify.register(healthCheckRoute, { prefix: '/api' });
}