export interface UserProps {
  id?: string;
  email: string;
  passwordHash: string;
  fullName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public readonly id?: string;
  public readonly email: string;
  public readonly passwordHash: string;
  public readonly fullName?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.fullName = props.fullName;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}

