import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { appConfig } from "./config";
import registerRoutes from "./routes";
import authPlugin from "./plugins/auth";

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

// Handle preflight requests globally
server.addHook('onRequest', async (request, reply) => {
  // Add CORS headers for all requests
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

// Handle empty JSON bodies for DELETE requests
server.addHook('preValidation', async (request) => {
  if (request.method === 'DELETE' && request.headers['content-type'] === 'application/json') {
    // For DELETE requests with JSON content-type but no body, set an empty object
    if (!request.body || Object.keys(request.body || {}).length === 0) {
      (request as any).body = {};
    }
  }
});

// Configure content type parser for DELETE requests
server.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const bodyStr = body.toString();
    if (req.method === 'DELETE' && (!bodyStr || bodyStr.trim() === '')) {
      return done(null, {});
    }
    const json = JSON.parse(bodyStr);
    done(null, json);
  } catch (err) {
    const error = err as Error;
    (error as any).statusCode = 400;
    done(error, undefined);
  }
});

// Register authentication plugin
server.register(authPlugin);

// Register routes
server.register(registerRoutes);

export default server;
