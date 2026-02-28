import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser'

import { PostgresUserRepository } from '../../infra/postgres/user.repository.js';
import { PostgresSessionRepository } from '../../infra/postgres/session.repository.js';
import { Argon2HashAdapter } from '../../secure/hash.adapter.js';
import { UserService } from '../../services/user.service.js';
import { createUserRouter } from './routes/user.routs.js';
import { JwtAdapter } from '../../secure/jwt.adapter.js';
import { RedisCacheRepository } from '../../infra/redis/redis.respository.js';
import { AuthService } from '../../services/auth.service.js';
import { authRoutes } from './routes/auth.routs.js';
import { AuthController } from './controllers/auth.controller.js';
import { UserController } from './controllers/user.controller.js';

import { UsageRepository } from '../../infra/postgres/usage.repository.js';
import { UsageService } from '../../services/usage.service.js';
import { UsageController } from './controllers/usage.controller.js';
import { usageRoutes } from './routes/usage.routs.js';
import { usageQueue } from '../../infra/bullmq/connection.js';
import { UsageWorker } from '../../infra/bullmq/usage.workers.js';

import { PostgresReportRepository } from '../../infra/postgres/report.repository.js';
import { ReportService } from '../../services/report.sercie.js';
import { ReportController } from './controllers/report.controller.js';
import { reportRoutes } from './routes/report.routs.js';

const app: Application = express();
app.use(cookieParser())

// Infra setup
const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();
const cacheRepository = new RedisCacheRepository();
const hashAdapter = new Argon2HashAdapter();
const securityPort = new JwtAdapter()
const usageRepository = new UsageRepository();
const reportRepository = new PostgresReportRepository();

// Service setup
const userService = new UserService(userRepository, hashAdapter);
const authService = new AuthService(userRepository, sessionRepository, cacheRepository, securityPort, hashAdapter);
const usageService = new UsageService(usageRepository);
const reportService = new ReportService(reportRepository);

//workers
new UsageWorker(usageService);

app.use(helmet());               // Secure HTTP headers
app.use(hpp());                  // Prevent HTTP Parameter Pollution
app.use(cors());                 // Enable Cross-Origin Resource Sharing
app.use(express.json());         // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));


// routs
app.use('/api/v1/users', createUserRouter(new UserController(userService)));

app.use('/api/v1/auth', authRoutes(new AuthController(authService)));

app.use('/api/v1/usage', usageRoutes(new UsageController(usageQueue)));

app.use('/api/v1/report', reportRoutes(new ReportController(reportService)));

// Health Check / Root
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: "Time Tracker API",
    version: "1.0.0",
    status: "Healthy",
    db_stack: "Postgres 18 / Redis 8",
    node_version: process.version
  });
});


// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl
  });
});


export default app;
