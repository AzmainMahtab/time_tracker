import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'time_tracker',
    max: 20, // Max pool size 
    idleTimeoutMillis: 30000,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret',
    refreshExpiry: '7d' // can be set to 30d based on your requirements
  }
};
