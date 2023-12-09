import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  mixin,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRequest } from '../middlewares/current-user.middleware';

export const AuthorizeGuard = (allowedRoles: string[]) => {
  class RolesGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request: AuthRequest = context.switchToHttp().getRequest();
      const result: boolean[] = request?.currentUser?.role?.map(
        (role: string) => allowedRoles.includes(role),
      );
      const hasRole = result.find((val: boolean) => val === true);
      if (!hasRole) {
        throw new UnauthorizedException(
          'Sorry, youre not authorized to access this resource',
        );
      }
      return true;
    }
  }
  const guard = mixin(RolesGuardMixin);
  return guard;
};
// @Injectable()
// export class AuthorizeGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}
//   canActivate(context: ExecutionContext): boolean {
//     const allowedRoles = this.reflector.get<string[]>(
//       'allowedRoles',
//       context.getHandler(),
//     );
//     const request: AuthRequest = context.switchToHttp().getRequest();
//     const result: boolean[] = request?.currentUser?.role?.map((role: string) =>
//       allowedRoles.includes(role),
//     );
//     const hasRole = result.find((val: boolean) => val === true);
//     if (!hasRole) {
//       throw new UnauthorizedException(
//         'Sorry, youre not authorized to access this resource',
//       );
//     }
//     return true;
//   }
// }
