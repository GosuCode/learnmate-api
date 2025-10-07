import { FastifyInstance } from 'fastify';
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
} from '@/controllers/groupController';
import { authPreHandler } from '@/middleware/auth';

export default async function groupRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    preHandler: [authPreHandler],
    handler: createGroup,
  });

  fastify.get('/', {
    preHandler: [authPreHandler],
    handler: getGroups,
  });

  fastify.get('/:id', {
    preHandler: [authPreHandler],
    handler: getGroupById,
  });

  fastify.put('/:id', {
    preHandler: [authPreHandler],
    handler: updateGroup,
  });

  fastify.delete('/:id', {
    preHandler: [authPreHandler],
    handler: deleteGroup,
  });
}
