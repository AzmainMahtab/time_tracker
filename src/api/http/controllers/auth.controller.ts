import { Request, Response } from 'express'
import { IAuthPort } from '../../../ports/auth.port.js'
import { LoginSchema, DeviceIdSchema } from '../dtos/auth.dto.js'

export class AuthController {
  constructor(private readonly authService: IAuthPort) { }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = LoginSchema.parse(req.body)
      const deviceId = DeviceIdSchema.parse(req.headers['x-device-id'])

      const tokens = await this.authService.login(email, password, deviceId)

      this.setCookie(res, tokens.refreshToken)
      return res.status(200).json({ accessToken: tokens.accessToken })
    } catch (error: any) {
      const status = error.name === 'ZodError' ? 400 : 401
      return res.status(status).json({ error: error.message || 'Login failed' })
    }
  }

  refresh = async (req: Request, res: Response) => {
    try {
      const oldRefreshToken = req.cookies.refreshToken
      if (!oldRefreshToken) throw new Error('NO_REFRESH_TOKEN')

      const tokens = await this.authService.refresh(oldRefreshToken)

      this.setCookie(res, tokens.refreshToken)
      return res.status(200).json({ accessToken: tokens.accessToken })
    } catch (error: any) {
      // Security: Clear cookie on failed refresh to prevent infinite loops
      res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' })
      return res.status(401).json({ error: error.message })
    }
  }

  logout = async (req: Request, res: Response) => {
    try {
      const { userId, deviceId } = req.user! //from authMiddleware 
      const refreshToken = req.cookies.refreshToken

      if (!refreshToken) return res.status(400).json({ error: 'No session found' })

      await this.authService.logout(userId, deviceId, refreshToken)

      res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' })
      return res.sendStatus(204)
    } catch (error: any) {
      return res.status(400).json({ error: error.message })
    }
  }

  logoutAll = async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!

      await this.authService.logoutAll(userId)

      res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' })
      return res.sendStatus(204)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  private setCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth/refresh'
    })
  }
}
