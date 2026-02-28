import * as db from './pool.js'
import { IUserRepository } from '../../ports/user.ports.js';
import { User } from '../../domains/user.domain.js';


export class PostgresUserRepository implements IUserRepository {

  //Save a user
  async save(user: User): Promise<User> {
    const sql = `
      INSERT INTO users (email, password_hash, full_name)
      VALUES ($1, $2, $3)
      RETURNING 
        uuid, 
        email, 
        password_hash AS "passwordHash", 
        full_name AS "fullName", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt";
    `;

    const values = [
      user.email,
      user.passwordHash,
      user.fullName
    ];

    // using pool's query method with parameter binding to prevent sql injection
    const { rows } = await db.query(sql, values);

    // Return a new User domain 
    return new User(rows[0]);
  }

  //find a user by email
  async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT 
        uuid, 
        email, 
        password_hash AS "passwordHash", 
        full_name AS "fullName", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"
      FROM users 
      WHERE email = $1;
    `;

    const { rows } = await db.query(sql, [email]);

    if (rows.length === 0) return null;

    return new User(rows[0]);
  }

  //find a user by the uuid
  async findById(uuid: string): Promise<User | null> {
    const sql = `
      SELECT 
        uuid, 
        email, 
        password_hash AS "passwordHash", 
        full_name AS "fullName", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"
      FROM users 
      WHERE uuid = $1;
    `;

    const { rows } = await db.query(sql, [uuid]);

    if (rows.length === 0) return null;

    return new User(rows[0]);
  }
}
