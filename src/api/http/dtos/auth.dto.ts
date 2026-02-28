import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})
export type LoginDto = z.infer<typeof LoginSchema>

export const DeviceIdSchema = z.string().min(1, 'X-Device-Id header is required')

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token cookie is missing')
})

export interface AuthUserDto {
  userId: string;
  email: string;
  deviceId: string;
}
