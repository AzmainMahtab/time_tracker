import { Session } from "../domains/auth.domain.js";

export interface ISessionRepository {
  save(session: Session): Promise<void>

  findActive(userId: string, deviceId: string): Promise<Session | null>

  delete(userId: string, deviceId: string): Promise<void>

  deleteAll(userId: string): Promise<void>
}
