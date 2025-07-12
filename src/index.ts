import app from "./app";
import { appConfig } from "./config";

async function start() {
  try {
    // Add healthcheck route
    app.get('/healthcheck', async (_request, _reply) => {
      return {
        status: 'ok',
        message: 'Server is running'
      };
    });

    await app.listen({ 
      port: appConfig.port, 
      host: appConfig.host 
    });
    
    console.log(`🚀 LearnMate Backend server running on http://${appConfig.host}:${appConfig.port}`);
    console.log(`Environment: ${appConfig.nodeEnv}`);
    console.log(`API Routes:`);
    console.log(`  - Users: /api/users`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
