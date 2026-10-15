import { app } from './app.js';
import { config } from './config/env.js';
import { checkDatabaseHealth, closePool } from './db/sqlServer.js';

import { seedInitialBooks } from './db/seedBooks.js';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('BookChain Library API Server starting...');
  console.log(`Port: ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Target Database: ${config.db.database} on ${config.db.server}`);
  console.log('----------------------------------------------------');

  // Verify database connectivity on startup
  const health = await checkDatabaseHealth();
  if (health.connected) {
    console.log(`[SQL Server] Connected successfully to [${health.database}] in ${health.latencyMs}ms.`);
    try {
      await seedInitialBooks();
    } catch (seedErr) {
      console.warn('[Seed] Initial book seeding error:', seedErr);
    }
  } else {
    console.warn(`[SQL Server] WARNING: Database connection failed: ${health.error}`);
    console.warn('[SQL Server] Server will still start, but database operations will return 500 until connection is restored.');
  }

  const server = app.listen(config.port, () => {
    console.log(`[HTTP Server] Listening on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    console.log('\nShutting down server gracefully...');
    server.close(async () => {
      await closePool();
      console.log('Database pool closed. Exiting.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal error during server bootstrap:', err);
  process.exit(1);
});
