import { TokenPair, UserClaims } from '../domains/auth.domain.js'

export interface ISecurityPort {
  generatePair(claims: UserClaims): Promise<TokenPair>

  verifyAccess(token: string): Promise<UserClaims>

  verifyRefresh(token: string): Promise<UserClaims>

  rotatePair(claims: UserClaims): Promise<TokenPair>
}
