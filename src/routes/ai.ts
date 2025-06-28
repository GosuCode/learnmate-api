import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AIServiceRequest } from '../types/ai';
import { aiController } from '../controllers/aiController';

export default async function aiRoutes(fastify: FastifyInstance) {
  // Generate summary
  fastify.post('/summarize', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1 },
          options: {
            type: 'object',
            properties: {
              maxLength: { type: 'number', minimum: 50, maximum: 1000 },
            },
          },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: AIServiceRequest }>, reply: FastifyReply) => {
      return aiController.generateSummary(request, reply);
    },
  });

  // Generate quiz
  fastify.post('/quiz', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1 },
          options: {
            type: 'object',
            properties: {
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              numQuestions: { type: 'number', minimum: 1, maximum: 20 },
            },
          },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: AIServiceRequest }>, reply: FastifyReply) => {
      return aiController.generateQuiz(request, reply);
    },
  });

  // Categorize content
  fastify.post('/categorize', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1 },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: AIServiceRequest }>, reply: FastifyReply) => {
      return aiController.categorizeContent(request, reply);
    },
  });

  // Analyze content with TF-IDF
  fastify.post('/analyze', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1 },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: AIServiceRequest }>, reply: FastifyReply) => {
      return aiController.analyzeContent(request, reply);
    },
  });
} 