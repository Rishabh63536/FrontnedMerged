import { UserRole, UserStatus } from './Enums.module';

// Only the fields relevant to CUSTOMER registration are used by this app —
// the backend DTO has more fields (vendor/driver/WM-specific) that this
// Customer-only frontend never needs to send.
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
