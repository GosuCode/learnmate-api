import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '@/services/userService';

const userService = new UserService();

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      name: string;
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = userService.verifyToken(token);
    if (!decoded) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    request.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    return;

  } catch (error) {
    console.error('Authentication error:', error);
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Token verification failed',
    });
  }
}

export async function authPreHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    const decoded = userService.verifyToken(token);
    if (!decoded) {
      throw new Error('Invalid or expired token');
    }

    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    request.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

  } catch (error) {
    console.error('Authentication error:', error);
    reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}