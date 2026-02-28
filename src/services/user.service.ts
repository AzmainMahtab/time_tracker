import { User } from '../domains/user.domain.js';
import { RegisterUserParams } from '../domains/user.perams.js';
import { IHashPort } from '../ports/hash.port.js';
import { IUserRepository } from '../ports/user.ports.js';
import { IUserService } from '../ports/user.ports.js';
import { ISecurityPort } from '../ports/jwt.port.js';
import { TokenPair } from '../domains/auth.domain.js';

export class UserService implements IUserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashPort: IHashPort,
    private readonly securityPort: ISecurityPort
  ) { }

  // regiser a new user
  async register(params: RegisterUserParams): Promise<User> {
    const { email, password, fullName } = params;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const hashedPassword = await this.hashPort.hash(password);

    const newUser = new User({
      email,
      passwordHash: hashedPassword,
      fullName,
    });

    return await this.userRepository.save(newUser);
  }


  async login(email: string, pass: string, deviceId: string): Promise<TokenPair> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const isPasswordValid = await this.hashPort.compare(pass, user.passwordHash)
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS')
    }

    return await this.securityPort.generatePair({
      userId: user.uuid!,
      email: user.email,
      deviceId
    })
  }

  //get the user profile
  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return user;
  }
}
