export interface DriverResponse {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  licenseNumber: string;
  licenseExpiry: string;
  city: string | null;
  available: boolean;
}
