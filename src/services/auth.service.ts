import { IAuthPort } from '../ports/auth.port.js'
import { ICachePort } from '../ports/cache.port.js'
import { ISessionRepository } from '../ports/session.ports.js'
import { ISecurityPort } from '../ports/jwt.port.js'
import { IHashPort } from '../ports/hash.port.js'
import { IUserRepository } from '../ports/user.ports.js'
import { Session, TokenPair } from '../domains/auth.domain.js'

export class AuthService implements IAuthPort {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly cacheRepo: ICachePort,
    private readonly securityPort: ISecurityPort,
    private readonly hashPort: IHashPort
  ) { }

  async login(email: string, password: string, deviceId: string): Promise<TokenPair> {
    const user = await this.userRepo.findByEmail(email)
    if (!user || !(await this.hashPort.compare(password, user.passwordHash))) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const tokens = await this.securityPort.generatePair({
      userId: user.uuid!,
      email: user.email,
      deviceId
    })

    const tokenHash = await this.hashPort.hash(tokens.refreshToken)
    await this.sessionRepo.save(new Session({
      userId: user.uuid!,
      deviceId,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date()
    }))

    return tokens
  }

  async refresh(oldRefreshToken: string): Promise<TokenPair> {
    const signature = oldRefreshToken.split('.')[2]

    if (await this.cacheRepo.isBlacklisted(signature)) {
      throw new Error('TOKEN_REVOKED')
    }

    const claims = await this.securityPort.verifyRefresh(oldRefreshToken)

    const lockKey = `refresh:${claims.userId}:${claims.deviceId}`
    if (!(await this.cacheRepo.setLock(lockKey, 10))) {
      throw new Error('REFRESH_IN_PROGRESS')
    }

    const session = await this.sessionRepo.findActive(claims.userId, claims.deviceId)

    if (!session || !(await this.hashPort.compare(oldRefreshToken, session.tokenHash))) {
      await this.logoutAll(claims.userId)
      throw new Error('REPLAY_ATTACK_DETECTED')
    }

    const newTokens = await this.securityPort.generatePair(claims)
    const newHash = await this.hashPort.hash(newTokens.refreshToken)

    await this.sessionRepo.save(new Session({ ...session, tokenHash: newHash }))
    await this.cacheRepo.setBlacklist(signature, 3600) // TTL depends on remaining token life

    return newTokens
  }

  async logout(userId: string, deviceId: string, refreshToken: string): Promise<void> {
    const claims = await this.securityPort.verifyRefresh(refreshToken)

    if (claims.userId !== userId || claims.deviceId !== deviceId) {
      throw new Error('UNAUTHORIZED_LOGOUT')
    }

    const signature = refreshToken.split('.')[2]

    await this.cacheRepo.setBlacklist(signature, 7 * 24 * 60 * 60)

    await this.sessionRepo.delete(userId, deviceId)
  }


  async logoutAll(userId: string): Promise<void> {
    // Clear all hashed sessions in Postgres
    await this.sessionRepo.deleteAll(userId)
  }
}
