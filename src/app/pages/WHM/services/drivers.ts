import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DriverResponse } from '../models/Driver.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({
  providedIn: 'root',
})
export class Drivers {
  private baseUrl: string = `${API_BASE_URL}/drivers`;

  constructor(private http: HttpClient) {}

  getAllAvailable(): Observable<DriverResponse[]> {
    return this.http.get<DriverResponse[]>(`${this.baseUrl}/available`);
  }

  /** Preferred over getAllAvailable() — matches Driver.city against the warehouse's
   *  own location string, case-insensitive. Pass in warehouse.location. */
  getAvailableByLocation(location: string): Observable<DriverResponse[]> {
    return this.http.get<DriverResponse[]>(`${this.baseUrl}/available/location/${encodeURIComponent(location)}`);
  }
}
