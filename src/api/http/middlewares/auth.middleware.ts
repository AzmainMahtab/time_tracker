import { Request, Response, NextFunction } from 'express'
import { ISecurityPort } from '../../../ports/jwt.port.js'

export const authMiddleware = (securityPort: ISecurityPort) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' })
      }

      const token = authHeader.split(' ')[1]

      const claims = await securityPort.verifyAccess(token)

      req.user = claims
      next()
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }
}
