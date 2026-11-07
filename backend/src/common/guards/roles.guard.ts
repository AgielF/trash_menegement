import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../../modules/auth/jwt.strategy';

/**
 * Guard role berbasis metadata `@Roles(...)`.
 *
 * Role dibaca dari payload JWT (`AuthenticatedUser.roles`), sehingga
 * tidak perlu query ke database di tiap request. Endpoint tanpa `@Roles`
 * diperbolehkan (hanya cukup `JwtAuthGuard`).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    const hasRole = user?.roles?.some((role) => requiredRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Anda tidak punya akses ke menu ini');
    }
    return true;
  }
}
