import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderResponse } from '../models/Order.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class Orders {
  private baseUrl: string = `${API_BASE_URL}/orders`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/all`);
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.baseUrl}/${orderId}/cancel`, {});
  }
}
