import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LoginResponse } from '../models/Auth.module';
import { UserRegistrationRequest, UserRegistrationResponse } from '../models/User.module';
import { API_BASE_URL } from '../config/api-config';

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

  getRoleProfileId(): number | null {
    const user = this.getStoredUser();
    return user ? user.roleProfileId : null;
  }
  
  getWarehouseId(): number | null {
    const user = this.getStoredUser();
    return user ? user.warehouseId : null;
  }

  getUserId(): number | null {
    const user = this.getStoredUser();
    return user ? user.userId : null;
  }
}
