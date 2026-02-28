import { User } from "../domains/user.domain.js";
import { RegisterUserParams } from "../domains/user.perams.js";

export interface IUserRepository {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

export interface IUserService {
  register(params: RegisterUserParams): Promise<User>;
  getProfile(userId: string): Promise<User>;
}


