export interface IHashPort {
  //Hash a plain text password
  hash(data: string): Promise<string>;

  // Compare the hash with given password
  compare(data: string, hash: string): Promise<boolean>;
}
