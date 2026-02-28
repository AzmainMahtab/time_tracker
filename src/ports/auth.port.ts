import { TokenPair } from '../domains/auth.domain.js'

export interface IAuthPort {

  login(email: string, password: string, deviceId: string): Promise<TokenPair>

  refresh(oldRefreshToken: string): Promise<TokenPair>

  logout(userId: string, deviceId: string, refreshToken: string): Promise<void>

  logoutAll(userId: string): Promise<void>
}
