import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApproveReturnRequest, RejectReturnRequest, ReturnRequestResponse } from '../models/ReturnRequest.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({
  providedIn: 'root',
})
export class ReturnRequests {
  private baseUrl: string = `${API_BASE_URL}/return-requests`;

  constructor(private http: HttpClient) {}

  getPending(): Observable<ReturnRequestResponse[]> {
    return this.http.get<ReturnRequestResponse[]>(`${this.baseUrl}/pending`);
  }

  approve(id: number, request: ApproveReturnRequest): Observable<ReturnRequestResponse> {
    return this.http.patch<ReturnRequestResponse>(`${this.baseUrl}/${id}/approve`, request);
  }

  reject(id: number, request: RejectReturnRequest): Observable<ReturnRequestResponse> {
    return this.http.patch<ReturnRequestResponse>(`${this.baseUrl}/${id}/reject`, request);
  }
}
