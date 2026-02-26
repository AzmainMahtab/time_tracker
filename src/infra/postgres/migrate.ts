import pkg from 'postgres-migrations';
const { migrate } = pkg;
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../config/env.js';

// necessary for ESM to resolve local paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const dbConfig = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  };

  const client = new pg.Client(dbConfig);

  try {
    await client.connect();
    console.log("Checking database migrations...");

    // point to migrations folder
    const migrationsDirectory = path.resolve(__dirname, '../../migrations/');

    await migrate({ client }, migrationsDirectory);

    console.log("Database is up to date.");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  } finally {
    await client.end();
  }
}
