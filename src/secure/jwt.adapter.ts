import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { TokenPair, UserClaims } from '../domains/auth.domain.js'
import { ISecurityPort } from '../ports/jwt.port.js'

export class JwtAdapter implements ISecurityPort {
  private readonly accessSecret = config.jwt.accessSecret as string
  private readonly refreshSecret = config.jwt.refreshSecret as string

  async generatePair(claims: UserClaims): Promise<TokenPair> {
    const payload = {
      userId: claims.userId,
      email: claims.email,
      deviceId: claims.deviceId
    }

    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: '15m'
    })

    const refreshToken = jwt.sign(
      { userId: claims.userId, deviceId: claims.deviceId },
      this.refreshSecret,
      { expiresIn: (config.jwt.refreshExpiry || '7d') as any }
    )

    return { accessToken, refreshToken }
  }

  async verifyAccess(token: string): Promise<UserClaims> {
    try {
      // cast the result to UserClaims 
      return jwt.verify(token, this.accessSecret) as unknown as UserClaims
    } catch (error) {
      throw new Error('INVALID_ACCESS_TOKEN')
    }
  }

  async verifyRefresh(token: string): Promise<UserClaims> {
    try {
      return jwt.verify(token, this.refreshSecret) as unknown as UserClaims
    } catch (error) {
      throw new Error('INVALID_REFRESH_TOKEN')
    }
  }

  async rotatePair(claims: UserClaims): Promise<TokenPair> {
    // destructuring to remove iat and exp
    const { iat, exp, ...cleanClaims } = claims
    return this.generatePair(cleanClaims)
  }
}
