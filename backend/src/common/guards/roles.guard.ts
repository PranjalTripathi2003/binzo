import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SupabaseService } from '../../modules/supabase/supabase.service';

/**
 * Guard that enforces role-based access control on protected routes.
 *
 * Flow:
 * 1. Reads required roles from the @Roles() decorator metadata.
 * 2. Reads req.user (populated by JwtStrategy) to get the userId.
 * 3. Fetches the user's role column from public.users in Supabase.
 * 4. Throws 403 if the role does not match.
 *
 * Must be used together with @UseGuards(AuthGuard('jwt'), RolesGuard)
 * so that JwtStrategy runs first and populates req.user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — route is open to authenticated users.
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // Fetch role from database — the JWT payload does not contain role to
    // prevent stale cached roles after an admin demotion.
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Requires one of: ${requiredRoles.join(', ')}`,
      );
    }

    // Attach role to request so controllers can read it without another query.
    request.user.role = user.role;

    return true;
  }
}
