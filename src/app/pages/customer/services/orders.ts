import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderResponse, PlaceOrderRequest } from '../models/Order.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({
  providedIn: 'root',
})
export class Orders {
  private baseUrl: string = `${API_BASE_URL}/orders`;

  constructor(private http: HttpClient) {}

  placeOrder(request: PlaceOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, request);
  }

  getById(orderId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.baseUrl}/${orderId}`);
  }

  getAllByCustomer(customerId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  getOrdersByCustomer(customerId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  getActiveByCustomer(customerId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/customer/${customerId}/active`);
  }

  getPastByCustomer(customerId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/customer/${customerId}/past`);
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.baseUrl}/${orderId}/cancel`, {});
  }
}
