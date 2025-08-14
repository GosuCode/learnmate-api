import { FastifyInstance } from 'fastify';
import userRoutes from '@/routes/userRoute';
import authRoutes from '@/routes/authRoute';
import healthCheckRoute from './healthcheck.route';
import semesterRoutes from './semesterRoute';
import subjectRoutes from './subjectRoute';
import contentRoutes from './contentRoute';
import summarizeRoutes from './summarizeRoute';
import mcqRoutes from './mcqRoute';
import fileProcessingRoutes from './fileProcessingRoute';

export default async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthCheckRoute, { prefix: '/api' });
  await fastify.register(userRoutes, { prefix: '/api/users' });
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(semesterRoutes, { prefix: '/api/semester' });
  await fastify.register(subjectRoutes, { prefix: '/api/subject' });
  await fastify.register(contentRoutes, { prefix: '/api/content' });
  await fastify.register(summarizeRoutes, { prefix: '/api/summarize' });
  await fastify.register(mcqRoutes, { prefix: '/api/mcq' });
  await fastify.register(fileProcessingRoutes, { prefix: '/api/files' });
}