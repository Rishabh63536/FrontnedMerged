import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentResponse } from '../models/Payment.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({
  providedIn: 'root',
})
export class Payments {
  private baseUrl: string = `${API_BASE_URL}/orders`;

  constructor(private http: HttpClient) {}

  payAdvance(orderId: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/${orderId}/payments/advance`, {});
  }

  payFinal(orderId: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/${orderId}/payments/final`, {});
  }

  getByOrder(orderId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.baseUrl}/${orderId}/payments`);
  }
}
