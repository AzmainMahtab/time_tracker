// src/api/http/routes/report.routes.ts
import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { JwtAdapter } from '../../../secure/jwt.adapter.js';

const securityPort = new JwtAdapter();

export function reportRoutes(controller: ReportController): Router {
  const router = Router();
  router.get('/apps', authMiddleware(securityPort), controller.getApps);
  router.get('/urls', authMiddleware(securityPort), controller.getUrls);
  return router;
}

