import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DriverAvailabilityRequest, DriverResponse, UpdateDriverRequest } from '../models/Driver.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class Drivers {
  private baseUrl: string = `${API_BASE_URL}/drivers`;

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<DriverResponse> {
    console.log(`${this.baseUrl}/${id}`);
    return this.http.get<DriverResponse>(`${this.baseUrl}/${id}`);
  }

  update(id: number, request: UpdateDriverRequest): Observable<DriverResponse> {
    return this.http.put<DriverResponse>(`${this.baseUrl}/${id}`, request);
  }

  updateAvailability(id: number, request: DriverAvailabilityRequest): Observable<DriverResponse> {
    return this.http.patch<DriverResponse>(`${this.baseUrl}/${id}/availability`, request);
  }
}