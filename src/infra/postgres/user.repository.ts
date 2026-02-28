import * as defaultPool from './pool.js';
import { IUserRepository } from '../../ports/user.ports.js';
import { User } from '../../domains/user.domain.js';

//interface for bot pg client and pool acceptance 
interface IDatabase {
  query: (text: string, params?: any[]) => Promise<any>;
}

export class PostgresUserRepository implements IUserRepository {
  // We store the connection here
  private readonly db: IDatabase;

  // If no db is provided, it defaults to the production pool.
  constructor(db: IDatabase = defaultPool) {
    this.db = db;
  }

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

    const values = [user.email, user.passwordHash, user.fullName];

    const { rows } = await this.db.query(sql, values);

    return new User(rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT 
        uuid, email, password_hash AS "passwordHash", 
        full_name AS "fullName", created_at AS "createdAt", 
        updated_at AS "updatedAt"
      FROM users 
      WHERE email = $1;
    `;

    const { rows } = await this.db.query(sql, [email]);
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  async findById(uuid: string): Promise<User | null> {
    const sql = `
      SELECT 
        uuid, email, password_hash AS "passwordHash", 
        full_name AS "fullName", created_at AS "createdAt", 
        updated_at AS "updatedAt"
      FROM users 
      WHERE uuid = $1;
    `;

    const { rows } = await this.db.query(sql, [uuid]);
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }
}
