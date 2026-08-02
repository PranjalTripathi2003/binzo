import { SetMetadata } from '@nestjs/common';

/** Metadata key used by RolesGuard to check the required role. */
export const ROLES_KEY = 'roles';

/**
 * Attaches a list of required roles to a controller or route handler.
 *
 * Usage: @Roles('admin')
 *
 * RolesGuard reads the roles set here and compares them against
 * req.user.role fetched from the users table.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
