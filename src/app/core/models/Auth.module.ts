export type UserRole = 'CUSTOMER' | 'VENDOR' | 'WAREHOUSE_MANAGER' | 'DRIVER' | 'ADMIN';

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  phone: string;
  role: UserRole;
  roleProfileId: number;
  roleProfileTable: string;
  warehouseId: number | null; // only populated for WAREHOUSE_MANAGER
}

// Maps each role to its dashboard's base route. Single source of truth for
// "where does this role land after login" — used by both the login redirect
// and the role guard's default "wrong role, go home" fallback.
export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  CUSTOMER: '/customer',
  VENDOR: '/vendor',
  WAREHOUSE_MANAGER: '/warehouse-manager',
  DRIVER: '/driver',
  ADMIN: '/admin',
};
