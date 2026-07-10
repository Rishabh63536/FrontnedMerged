import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReturnRequestResponse } from '../models/ReturnRequest.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class ReturnRequests {
  private baseUrl: string = `${API_BASE_URL}/return-requests`;

  constructor(private http: HttpClient) {}

  getByDriver(driverId: number): Observable<ReturnRequestResponse[]> {
    return this.http.get<ReturnRequestResponse[]>(`${this.baseUrl}/driver/${driverId}`);
  }

  /** Photo is OPTIONAL here — pass null to skip it (backend allows omitting the part entirely). */
  restock(returnId: number, photo: File | null): Observable<ReturnRequestResponse> {
    const formData = new FormData();
    if (photo) formData.append('photo', photo);
    return this.http.patch<ReturnRequestResponse>(`${this.baseUrl}/${returnId}/restock`, formData);
  }
}
