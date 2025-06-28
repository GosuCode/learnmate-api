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
    console.log(`  - Content: /api/content`);
    console.log(`  - AI Services: /api/ai`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
