export type UserRole = 'CUSTOMER' | 'VENDOR' | 'WAREHOUSE_MANAGER' | 'DRIVER' | 'ADMIN';

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  phone: string;
  role: UserRole;
  roleProfileId: number;
  roleProfileTable: string;
  warehouseId: number | null; //for WAREHOUSE_MANAGER
}

export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  CUSTOMER: '/customer',
  VENDOR: '/vendor',
  WAREHOUSE_MANAGER: '/warehouse-manager',
  DRIVER: '/driver',
  ADMIN: '/admin',
};
