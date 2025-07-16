import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { appConfig } from "./config";
import registerRoutes from "./routes";

const server = fastify({
  // Logger only for production
  logger: appConfig.nodeEnv === 'production',
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
});

server.register(helmet);

// Register routes
server.register(registerRoutes);

export default server;
