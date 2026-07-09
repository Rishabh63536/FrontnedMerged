import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Login } from '../services/login';
import { ROLE_HOME_ROUTE, UserRole } from '../models/Auth.module';

/**
 * ONE guard for every role section, instead of 4 separate hardcoded ones.
 * Reads the allowed roles off the route's own `data` property, e.g.:
 *
 *   { path: 'customer', canActivate: [roleGuard], data: { roles: ['CUSTOMER'] }, ... }
 *
 * - Not logged in at all -> /login
 * - Logged in, but wrong role for this section -> sent to THEIR OWN home
 *   route instead of /login (they have a valid session, just not for this
 *   section — bouncing them to /login would be confusing since they're not
 *   actually logged out).
 */
export const roleGuard: CanActivateFn = (route) => {
  const loginService = inject(Login);
  const router = inject(Router);

  const user = loginService.getStoredUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data['roles'] as UserRole[] | undefined;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    router.navigate([ROLE_HOME_ROUTE[user.role]]);
    return false;
  }

  return true;
};
