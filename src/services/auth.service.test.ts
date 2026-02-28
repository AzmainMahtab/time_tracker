import { describe, it, expect, beforeEach } from 'vitest'
import { AuthService } from './auth.service.js'
import { mock, MockProxy } from 'vitest-mock-extended' // Great for mocking interfaces

// Import your ports (using your path structure)
import { IUserRepository } from '../ports/user.ports.js'
import { ISessionRepository } from '../ports/session.ports.js'
import { ICachePort } from '../ports/cache.port.js'
import { ISecurityPort } from '../ports/jwt.port.js'
import { IHashPort } from '../ports/hash.port.js'

describe('AuthService', () => {
  let service: AuthService
  let userRepo: MockProxy<IUserRepository>
  let sessionRepo: MockProxy<ISessionRepository>
  let cacheRepo: MockProxy<ICachePort>
  let securityPort: MockProxy<ISecurityPort>
  let hashPort: MockProxy<IHashPort>

  beforeEach(() => {
    userRepo = mock<IUserRepository>()
    sessionRepo = mock<ISessionRepository>()
    cacheRepo = mock<ICachePort>()
    securityPort = mock<ISecurityPort>()
    hashPort = mock<IHashPort>()

    service = new AuthService(userRepo, sessionRepo, cacheRepo, securityPort, hashPort)
  })

  describe('login', () => {
    it('should throw if user is not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null)
      await expect(service.login('test@test.com', 'pw', 'dev1')).rejects.toThrow('INVALID_CREDENTIALS')
    })

    it('should throw if password does not match', async () => {
      userRepo.findByEmail.mockResolvedValue({ uuid: '1', email: 't@t.com', passwordHash: 'hashed' } as any)
      hashPort.compare.mockResolvedValue(false)
      await expect(service.login('t@t.com', 'wrong', 'dev1')).rejects.toThrow('INVALID_CREDENTIALS')
    })

    it('should return tokens and save session on success', async () => {
      const mockUser = { uuid: 'user-123', email: 't@t.com', passwordHash: 'hash' }
      const mockTokens = { accessToken: 'at', refreshToken: 'rt' }

      userRepo.findByEmail.mockResolvedValue(mockUser as any)
      hashPort.compare.mockResolvedValue(true)
      securityPort.generatePair.mockResolvedValue(mockTokens)
      hashPort.hash.mockResolvedValue('rt-hash')

      const result = await service.login('t@t.com', 'pw', 'dev1')

      expect(result).toEqual(mockTokens)
      expect(sessionRepo.save).toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    const oldToken = 'header.payload.signature'
    const claims = { userId: 'u1', deviceId: 'd1', email: 't@t.com' }

    it('should throw if token is blacklisted', async () => {
      cacheRepo.isBlacklisted.mockResolvedValue(true)
      await expect(service.refresh(oldToken)).rejects.toThrow('TOKEN_REVOKED')
    })

    it('should detect replay attack and logout all sessions', async () => {
      cacheRepo.isBlacklisted.mockResolvedValue(false)
      securityPort.verifyRefresh.mockResolvedValue(claims)
      cacheRepo.setLock.mockResolvedValue(true)

      // Simulate session missing or hash mismatch
      sessionRepo.findActive.mockResolvedValue(null)

      await expect(service.refresh(oldToken)).rejects.toThrow('REPLAY_ATTACK_DETECTED')
      expect(sessionRepo.deleteAll).toHaveBeenCalledWith('u1')
    })

    it('should successfully rotate tokens', async () => {
      cacheRepo.isBlacklisted.mockResolvedValue(false)
      securityPort.verifyRefresh.mockResolvedValue(claims)
      cacheRepo.setLock.mockResolvedValue(true)
      sessionRepo.findActive.mockResolvedValue({ tokenHash: 'matched-hash' } as any)
      hashPort.compare.mockResolvedValue(true)
      securityPort.generatePair.mockResolvedValue({ accessToken: 'new-a', refreshToken: 'new-r' })

      const result = await service.refresh(oldToken)

      expect(result.accessToken).toBe('new-a')
      expect(cacheRepo.setBlacklist).toHaveBeenCalledWith('signature', 604800000)
    })
  })

  describe('logout', () => {
    it('should blacklist token and delete session', async () => {
      const token = 'a.b.sig'
      securityPort.verifyRefresh.mockResolvedValue({ userId: 'u1', deviceId: 'd1' } as any)

      await service.logout('u1', 'd1', token)

      expect(cacheRepo.setBlacklist).toHaveBeenCalledWith('sig', expect.any(Number))
      expect(sessionRepo.delete).toHaveBeenCalledWith('u1', 'd1')
    })
  })
})
