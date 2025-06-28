import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/userService';

const userService = new UserService();

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
    
    // Verify JWT token
    const decoded = userService.verifyToken(token);
    
    if (!decoded) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Verify user exists
    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User not found',
      });
    }
    
    // Add user info to request for use in controllers
    (request as any).user = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
    
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Token verification failed',
    });
  }
} 