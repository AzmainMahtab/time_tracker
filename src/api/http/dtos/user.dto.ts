import { z } from 'zod';

// define the schema
export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required').optional(),
});

// infer the type from the schema
export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;

// response DTO 
export interface UserResponseDto {
  uuid: string;
  email: string;
  fullName?: string;
  createdAt: Date;
}
