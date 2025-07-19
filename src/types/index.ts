export * from '@/types/user';
export * from '@/types/content';
export * from '@/types/api';

// Extend FastifyInstance to include authenticate method
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
} 