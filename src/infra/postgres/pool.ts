import pg from 'pg';
const { Pool } = pg;
import { config } from '../../config/env.js';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners for debugging and health
pool.on('connect', () => {
  console.log('Postgres 18 connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
