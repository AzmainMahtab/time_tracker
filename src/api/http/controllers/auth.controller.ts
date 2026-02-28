import { Request, Response } from 'express'
import { IAuthPort } from '../../../ports/auth.port.js'

export class AuthController {
  constructor(private readonly authService: IAuthPort) { }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body
      const deviceId = req.headers['x-device-id'] as string || 'unknown-device'

      const tokens = await this.authService.login(email, password, deviceId)

      this.setCookie(res, tokens.refreshToken)
      return res.status(200).json({ accessToken: tokens.accessToken })
    } catch (error: any) {
      return res.status(401).json({ error: error.message })
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
      res.clearCookie('refreshToken')
      return res.status(401).json({ error: error.message })
    }
  }

  logout = async (req: Request, res: Response) => {
    try {
      const { userId, deviceId } = req.user! // From auth middleware
      const refreshToken = req.cookies.refreshToken

      await this.authService.logout(userId, deviceId, refreshToken)

      res.clearCookie('refreshToken')
      return res.sendStatus(204)
    } catch (error) {
      return res.sendStatus(400)
    }
  }

  logoutAll = async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!
      await this.authService.logoutAll(userId)

      res.clearCookie('refreshToken')
      return res.sendStatus(204)
    } catch (error) {
      return res.sendStatus(500)
    }
  }

  private setCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true, // Prevents XSS
      secure: process.env.NODE_ENV === 'production', // Only over HTTPS
      sameSite: 'strict', // Prevents CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
      path: '/api/v1/auth/refresh' // Restrict cookie to refresh endpoint
    })
  }
}
