import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { appConfig } from "./config";
import registerRoutes from "./routes";
import authPlugin from "./plugins/auth";

const server = fastify({
  // Logger only for production
  logger: appConfig.nodeEnv === 'production',
});

// Register plugins
server.register(cors, {
  origin: appConfig.cors.origin,
  credentials: appConfig.cors.credentials,
});

server.register(helmet);

// Register authentication plugin
server.register(authPlugin);

// Register routes
server.register(registerRoutes);

export default server;
