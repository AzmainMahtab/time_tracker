import argon2 from 'argon2';
import { IHashPort } from '../ports/hash.port.js';

export class Argon2HashAdapter implements IHashPort {

  //hash the string
  async hash(data: string): Promise<string> {
    try {
      return await argon2.hash(data);
    } catch (error) {
      throw new Error('Error while hashing data');
    }
  }

  // verify string password with hashed password
  async compare(data: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, data);
    } catch (error) {
      return false;
    }
  }
}
