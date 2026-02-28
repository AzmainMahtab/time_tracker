import { UserClaims } from '../domains/auth.domain.js'

declare global {
  namespace Express {
    interface Request {
      user?: UserClaims
    }
  }
}

export { }
