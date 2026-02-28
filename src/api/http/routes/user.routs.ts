import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { IUserService } from '../../../ports/user.ports.js';

export const createUserRouter = (userService: IUserService): Router => {
  const router = Router();
  const controller = new UserController(userService);

  router.post('/register', controller.register);
  router.get('/:id', controller.getProfile);

  return router;
};
