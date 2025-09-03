import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { appConfig } from "./config";
import registerRoutes from "./routes";

const server = fastify({
  // Logger only for production
  logger: appConfig.nodeEnv === 'production',
  // Configure body parser to handle empty JSON bodies
  bodyLimit: 1048576, // 1MB
});

const listeners = ['SIGINT', 'SIGTERM'];
listeners.forEach(signal => {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
});

server.register(cors, {
  origin: appConfig.cors.origin,
  credentials: appConfig.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
});

server.register(helmet);

server.addHook('onRequest', async (request, reply) => {
  const origin = request.headers.origin;
  if (origin && appConfig.cors.origin.includes(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
  } else if (appConfig.nodeEnv === 'development') {
    // In development, allow all origins
    reply.header('Access-Control-Allow-Origin', '*');
  }

  reply.header('Access-Control-Allow-Credentials', 'true');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  if (request.method === 'OPTIONS') {
    reply.header('Access-Control-Max-Age', '86400');
    reply.send();
  }
});

server.register(registerRoutes);

export default server;
