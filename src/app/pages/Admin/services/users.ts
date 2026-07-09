import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-config';
import { UpdateUserRequest, UserRegistrationRequest, UserRegistrationResponse, UserResponse } from '../../../core/models/User.module';

@Injectable({ providedIn: 'root' })
export class Users {
  private baseUrl: string = `${API_BASE_URL}/users`;

  constructor(private http: HttpClient) {}

  register(request: UserRegistrationRequest): Observable<UserRegistrationResponse> {
    return this.http.post<UserRegistrationResponse>(`${this.baseUrl}/register`, request);
  }

  getAll(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
  }

  update(id: number, request: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/${id}`, request);
  }

  updateStatus(id: number, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/${id}/status`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
