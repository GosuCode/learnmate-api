import app from "./app";
import { appConfig } from "./config";

async function start() {
  try {

    await app.listen({
      port: appConfig.port,
      host: appConfig.host
    });

    console.log(`🚀 LearnMate Backend server running on http://${appConfig.host}:${appConfig.port}`);
    console.log(`Environment: ${appConfig.nodeEnv}`);
    console.log(`API Routes:`);
    console.log(`  - Users: /api/users`);
  } catch (err) {
    console.error('❌ Error during server startup:');
    console.error(err);
    process.exit(1);
  }
}

start();
