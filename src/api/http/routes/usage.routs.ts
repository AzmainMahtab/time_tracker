import { Router } from 'express'
import { UsageController } from '../controllers/usage.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { JwtAdapter } from '../../../secure/jwt.adapter.js'

const securityPort = new JwtAdapter()

export function usageRoutes(controller: UsageController): Router {
  const router = Router()

  router.post('/track', authMiddleware(securityPort), controller.trackUsage)

  return router
}
