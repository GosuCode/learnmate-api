import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateUserRequest, LoginRequest } from '../types/user';
import { userController } from '../controllers/userController';

export default async function userRoutes(fastify: FastifyInstance) {
  // Register user
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'name', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2 },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: CreateUserRequest }>, reply: FastifyReply) => {
      return userController.register(request, reply);
    },
  });

  // Login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      return userController.login(request, reply);
    },
  });

  // Get user profile
  fastify.get('/profile', {
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getProfile(request, reply);
    },
  });
} 