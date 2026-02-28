export interface AuthLogin {
  email: string
  passwordHash: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface UserClaims {
  userId: string
  email: string
  deviceId: string
  iat?: number
  exp?: number
}

export class Session {
  readonly uuid?: string
  readonly userId: string
  readonly deviceId: string
  readonly tokenHash: string
  readonly expiresAt: Date
  readonly createdAt: Date

  constructor(props: Session) {
    this.uuid = props.uuid
    this.userId = props.userId
    this.deviceId = props.deviceId
    this.tokenHash = props.tokenHash
    this.expiresAt = props.expiresAt
    this.createdAt = props.createdAt
  }
}
