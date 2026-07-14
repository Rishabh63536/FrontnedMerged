import { UserRole } from './Auth.module';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserResponse {
  id: number;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  password?: string;
}

// Shared shape: used by Customer's self-registration form AND Admin's
// Create User form — both ultimately hit the same POST /users/register.
export interface UserRegistrationRequest {
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  companyName?: string;
  gstNumber?: string;
  email?: string;
  shippingAddress?: string;
  billingAddress?: string;
  creditLimit?: number;
  paymentTerms?: string;
  businessAddress?: string;
  contactPerson?: string;
  employeeCode?: string;
  designation?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  location?: string;
}

export interface UserRegistrationResponse {
  userId: number;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  roleProfileId: number;
  roleProfileTable: string;
}
