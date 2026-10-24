import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../strategies/jwt.strategy';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true; 

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    if (!user?.permissions) throw new ForbiddenException('No permissions found');

    const hasAll = required.every((code) => user.permissions.includes(code));
    if (!hasAll) {
      throw new ForbiddenException(`Missing permission(s): ${required.join(', ')}`);
    }
    return true;
  }
}