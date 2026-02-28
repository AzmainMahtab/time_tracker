// src/api/http/routes/auth.routes.ts
import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { JwtAdapter } from '../../../secure/jwt.adapter.js'

const securityPort = new JwtAdapter()

export function authRoutes(controller: AuthController): Router {
  const router = Router()

  router.post('/login', controller.login)
  router.post('/refresh', controller.refresh)

  // Protected routes
  router.post('/logout', authMiddleware(securityPort), controller.logout)
  router.post('/logout-all', authMiddleware(securityPort), controller.logoutAll)

  return router
}
