import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { PostgresUserRepository } from './user.repository.js';
import { User } from '../../domains/user.domain.js';

describe('PostgresUserRepository Integration', () => {
  let container: StartedPostgreSqlContainer;
  let testPool: Pool;
  let repository: PostgresUserRepository;

  beforeAll(async () => {
    // start a test container
    container = await new PostgreSqlContainer('postgres:18-alpine').start();

    //  create a pool using the container's dynamic URI
    testPool = new Pool({
      connectionString: container.getConnectionUri(),
    });

    //Schema to test against
    await testPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT uuidv7(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // injecting the testPool into the repo
    repository = new PostgresUserRepository(testPool);
  }, 60000);

  afterAll(async () => {
    if (testPool) await testPool.end();
    if (container) await container.stop();
  });

  it('should successfully save a user and return the DB-generated uuidv7', async () => {
    const newUser = new User({
      email: 'test@gemini.ai',
      passwordHash: 'argon2_hashed_secret',
      fullName: 'Gemini Tester'
    });

    const savedUser = await repository.save(newUser);

    // Verify properties
    expect(savedUser.email).toBe('test@gemini.ai');
    expect(savedUser.uuid).toBeDefined();

    // UUIDv7 verification: The 13th character (version) should be '7'
    // Format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
    expect(savedUser.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);

    expect(savedUser.createdAt).toBeInstanceOf(Date);
  });

  it('should find a user by email after they have been saved', async () => {
    const email = 'search@test.com';
    const user = new User({
      email,
      passwordHash: 'hash',
      fullName: 'Search Test'
    });

    await repository.save(user);

    const foundUser = await repository.findByEmail(email);

    expect(foundUser).not.toBeNull();
    expect(foundUser?.email).toBe(email);
    expect(foundUser?.fullName).toBe('Search Test');
  });

  it('should return null if searching for an email that does not exist', async () => {
    const foundUser = await repository.findByEmail('nonexistent@test.com');
    expect(foundUser).toBeNull();
  });

  it('should find a user by their generated uuid', async () => {
    const user = new User({
      email: 'uuid-test@test.com',
      passwordHash: 'hash',
      fullName: 'UUID Test'
    });

    const saved = await repository.save(user);
    const found = await repository.findById(saved.uuid!);

    expect(found).not.toBeNull();
    expect(found?.uuid).toBe(saved.uuid);
  });
});
