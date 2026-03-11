import { config } from '../../config/env.js';
import app from './app.js';
import { runMigrations } from '../../infra/postgres/migrate.js';
import { connectRedis } from '../../infra/redis/client.js';

const start = async () => {
  try {
    // run database migration at start time
    await runMigrations();
    await connectRedis();


    const server = app.listen(config.port, () => {
      console.log(`\n Server is live!`);
      console.log(`URL: http://localhost:${config.port}`);
      console.log(`Mode: ${config.nodeEnv}`);
    });

    // graceful shutdown logic
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Closing HTTP server...`);
      server.close(() => {
        console.log('HTTP server closed. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // catch errors that happen outside of the express flow
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION!');
      console.error(err);
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
