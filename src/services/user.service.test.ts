import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user.service.js';
import { User } from '../domains/user.domain.js';
import { IHashPort } from '../ports/hash.port.js';
import { IUserRepository } from '../ports/user.ports.js';

describe('UserService Unit Tests', () => {
  //  Create Mock Objects
  let mockRepo: IUserRepository;
  let mockHasher: IHashPort;
  let service: UserService;

  beforeEach(() => {
    // vi.mock logic to satisfy the interfaces
    mockRepo = {
      save: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    } as unknown as IUserRepository;

    mockHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IHashPort;

    service = new UserService(mockRepo, mockHasher);
  });

  describe('register', () => {
    it('should throw an error if the email is already taken', async () => {
      // Arrange: Simulate that the user already exists in DB
      vi.mocked(mockRepo.findByEmail).mockResolvedValue(new User({
        email: 'exists@test.com',
        passwordHash: 'any'
      }));

      const params = {
        email: 'exists@test.com',
        password: 'password123',
        fullName: 'Test User'
      };

      // Act & Assert
      await expect(service.register(params)).rejects.toThrow('USER_ALREADY_EXISTS');

      // Ensure we didn't waste CPU hashing a password for a user that can't be saved
      expect(mockHasher.hash).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should hash the password and save the user if email is unique', async () => {
      // Arrange
      vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockHasher.hash).mockResolvedValue('safe_hash_123');

      const params = {
        email: 'new@test.com',
        password: 'password123',
        fullName: 'New User'
      };

      // Act
      await service.register(params);

      // Assert
      expect(mockHasher.hash).toHaveBeenCalledWith('password123');
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@test.com',
        passwordHash: 'safe_hash_123'
      }));
    });
  });

  describe('getProfile', () => {
    it('should throw an error if user is not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.getProfile('some-uuid')).rejects.toThrow('USER_NOT_FOUND');
    });

    it('should return the user if found', async () => {
      const existingUser = new User({ email: 'test@test.com', passwordHash: 'hash' });
      vi.mocked(mockRepo.findById).mockResolvedValue(existingUser);

      const result = await service.getProfile('some-uuid');

      expect(result).toBe(existingUser);
    });
  });
});
