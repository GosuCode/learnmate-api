import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userController } from '@/controllers/userController';
import { CreateUserInput, LoginUserInput } from '@/models/userModel';

export default async function userRoutes(app: FastifyInstance) {

  app.post('/register', async (request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) => {
    return userController.register(request, reply);
  });

  app.post('/login', async (request: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply) => {
    return userController.login(request, reply);
  });

  app.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    return userController.getProfile(request, reply);
  });

  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return userController.getAllUsers(request, reply);
  });

  app.log.info('User routes registered');

  return app;
} 