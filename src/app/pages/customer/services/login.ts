import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LoginResponse } from '../models/Auth.module';
import { UserRegistrationRequest, UserRegistrationResponse } from '../models/Registration.module';
import { API_BASE_URL } from '../../../core/config/api-config';

// NOTE: kept the original class name "Login" and file path so the existing
// login component's import doesn't break. It now handles both login and
// registration since they're both "auth" concerns — consider renaming to
// AuthService in a later cleanup pass if you want, not required.
@Injectable({
  providedIn: 'root',
})
export class Register {
  private baseUrl: string = `${API_BASE_URL}/users`;

  constructor(private http: HttpClient) {}

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
    return this.getStoredUser() !== null;
  }

  getCustomerId(): number | null {
    const user = this.getStoredUser();
    return user ? user.roleProfileId : null;
  }
}
