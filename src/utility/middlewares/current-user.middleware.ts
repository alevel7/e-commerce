import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(private userService: UsersService) {}
  async use(req: AuthRequest, resp: Response, next: NextFunction) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (
      !authHeader ||
      Array.isArray(authHeader) ||
      !authHeader.startsWith('Bearer')
    ) {
      req.currentUser = null;
    } else {
      try {
        const token = authHeader.split(' ')[1];
        const { id } = <JwtPayload>(
          verify(token, process.env.ACCESS_TOKEN_SECRET_KEY)
        );
        const currentUser = await this.userService.findOne(+id);
        req.currentUser = currentUser;
      } catch (error) {
        req.currentUser = null;
      }
    }
    next();
  }
}
interface JwtPayload {
  id: string;
}

// declare global {
//   namespace Express {
//     interface Request {
//       currentUser?: UserEntity;
//     }
//   }
// }
export interface AuthRequest extends Request {
  currentUser?: UserEntity;
}
