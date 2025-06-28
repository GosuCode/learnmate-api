import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateContentRequest } from '../types/content';
import { contentController } from '../controllers/contentController';

export default async function contentRoutes(fastify: FastifyInstance) {
  // Create content
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['title', 'content', 'type'],
        properties: {
          title: { type: 'string', minLength: 1 },
          content: { type: 'string', minLength: 1 },
          type: { type: 'string', enum: ['text', 'pdf', 'url'] },
          category: { type: 'string' },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: CreateContentRequest }>, reply: FastifyReply) => {
      return contentController.createContent(request, reply);
    },
  });

  // Get user's content
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          category: { type: 'string' },
        },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return contentController.getUserContent(request, reply);
    },
  });

  // Get specific content
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return contentController.getContent(request, reply);
    },
  });

  // Delete content
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return contentController.deleteContent(request, reply);
    },
  });
} 