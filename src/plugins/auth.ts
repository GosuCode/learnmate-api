import { FastifyInstance } from 'fastify';
import { authenticate } from '@/middleware/auth';

export default async function authPlugin(fastify: FastifyInstance) {
    // Register authentication middleware
    fastify.decorate('authenticate', authenticate);
} 