import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { JwtAdapter } from '../../../secure/jwt.adapter.js';

const securityPort = new JwtAdapter()

export const createUserRouter = (controller: UserController): Router => {
  const router = Router();

  router.post('/register', controller.register);
  router.get('/:id', authMiddleware(securityPort), controller.getProfile);

  return router;
};
