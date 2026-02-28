import { Request, Response } from 'express';
import { IUserService } from '../../../ports/user.ports.js';
import { RegisterUserSchema } from '../dtos/user.dto.js';

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
