import { FastifyInstance } from 'fastify';

export default async function healthCheckRoute(server: FastifyInstance) {
  server.get('/healthcheck', async () => {
    return {
      status: 'ok',
      message: 'Server is running',
    };
  });
}
