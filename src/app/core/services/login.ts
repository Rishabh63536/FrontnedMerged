import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LoginResponse } from '../models/Auth.module';
import { UserRegistrationRequest, UserRegistrationResponse } from '../models/User.module';
import { API_BASE_URL } from '../config/api-config';

// Shared across every role module — this is the ONE auth service for the
// whole unified app. Only the Customer module actually calls register()
// (self-registration); Admin creates every other role via the same endpoint
// from its own Create User screen.
@Injectable({ providedIn: 'root' })
export class Login {
  private baseUrl: string = `${API_BASE_URL}/users`;

  constructor(private http: HttpClient) {}

  login(phone: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { phone, password });
  }

  register(request: UserRegistrationRequest): Observable<UserRegistrationResponse> {
    return this.http.post<UserRegistrationResponse>(`${this.baseUrl}/register`, request);
  }

  logout(): void {
    localStorage.removeItem('result');
  }

  getStoredUser(): LoginResponse | null {
    const data = localStorage.getItem('result');
    return data ? (JSON.parse(data) as LoginResponse) : null;
  }

  isLoggedIn(): boolean {
    return this.getStoredUser() !== null ;
  }

  /** The logged-in user's own role-profile id — customerId/vendorId/driverId/
   *  warehouseManagerId, whichever applies to their role. Not meaningful for ADMIN. */
  getRoleProfileId(): number | null {
    const user = this.getStoredUser();
    return user ? user.roleProfileId : null;
  }

  /** Only populated for WAREHOUSE_MANAGER — null for every other role. */
  getWarehouseId(): number | null {
    const user = this.getStoredUser();
    return user ? user.warehouseId : null;
  }

  getUserId(): number | null {
    const user = this.getStoredUser();
    return user ? user.userId : null;
  }
}
