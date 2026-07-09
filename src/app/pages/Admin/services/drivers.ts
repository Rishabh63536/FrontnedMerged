import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-config';
import { DriverResponse } from '../models/Driver.module';

@Injectable({ providedIn: 'root' })
export class Drivers {
  private baseUrl: string = `${API_BASE_URL}/drivers`;

  constructor(private http: HttpClient) {}

  getAllAvailable(): Observable<DriverResponse[]> {
    return this.http.get<DriverResponse[]>(`${this.baseUrl}/available`);
  }
}
