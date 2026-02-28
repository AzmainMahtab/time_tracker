import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { IUserService } from '../../../ports/user.ports.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { JwtAdapter } from '../../../secure/jwt.adapter.js';

const securityPort = new JwtAdapter()

export const createUserRouter = (userService: IUserService): Router => {
  const router = Router();
  const controller = new UserController(userService);

  router.post('/register', controller.register);
  router.get('/:id', authMiddleware(securityPort), controller.getProfile);
  router.post('/login', controller.login)

  return router;
};
