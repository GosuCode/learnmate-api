import { FastifyRequest, FastifyReply } from 'fastify';
import { appConfig } from '../config';

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
    
    // TODO: Implement JWT verification
    // - Verify token signature
    // - Check token expiration
    // - Extract user information
    
    // For now, just check if token exists
    if (!token) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }
    
    // Add user info to request for use in controllers
    (request as any).user = {
      id: 'temp-user-id',
      email: 'user@example.com',
    };
    
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Token verification failed',
    });
  }
} 