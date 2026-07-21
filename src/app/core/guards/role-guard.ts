import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Login } from '../services/login';
import { ROLE_HOME_ROUTE, UserRole } from '../models/Auth.module';

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
