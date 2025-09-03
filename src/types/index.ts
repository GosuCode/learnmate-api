export * from '@/types/user';
export * from '@/types/content';
export * from '@/types/api';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      name: string;
    };
  }
} 