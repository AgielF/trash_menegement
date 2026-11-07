import { SetMetadata } from '@nestjs/common';

/** Metadata key untuk `RolesGuard`. */
export const ROLES_KEY = 'roles';

/**
 * Batasi endpoint ke role tertentu (mis. `@Roles('admin')`).
 * Daftar role dicek dari payload JWT (`user.roles`) oleh `RolesGuard`.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
