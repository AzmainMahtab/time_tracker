import { Request, Response } from 'express';
import { IUserService } from '../../../ports/user.ports.js';
import { RegisterUserSchema } from '../dtos/user.dto.js';
import { LoginSchema } from '../dtos/auth.dto.js';
import { z } from 'zod';

export class UserController {
  constructor(private readonly userService: IUserService) { }

  register = async (req: Request, res: Response) => {
    try {
      // Validate Input using Zod
      const validatedData = RegisterUserSchema.parse(req.body);

      // Call Service
      const user = await this.userService.register(validatedData);

      // Map to Response DTO (Stripping passwordHash)
      return res.status(201).json({
        uuid: user.uuid,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      if (error.message === 'USER_ALREADY_EXISTS') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };


  login = async (req: Request, res: Response) => {
    try {
      // validate input using the login dto
      const { email, password } = LoginSchema.parse(req.body)

      // identify the device via header
      const deviceId = req.headers['x-device-id'] as string || 'unknown-device'

      const tokens = await this.userService.login(email, password, deviceId)

      // set refresh token in secure http-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })

      return res.status(200).json({
        accessToken: tokens.accessToken
      })
    } catch (error: any) {
      // handle zod validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.flatten().fieldErrors
        })
      }

      if (error.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
  getProfile = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string

      const user = await this.userService.getProfile(id)

      return res.status(200).json({
        uuid: user.uuid,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
      })
    } catch (error: any) {
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User not found' })
      }
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  };
}
