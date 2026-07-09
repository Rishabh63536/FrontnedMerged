import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssignDriverRequest, OrderResponse } from '../models/Order.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({
  providedIn: 'root',
})
export class Orders {
  private baseUrl: string = `${API_BASE_URL}/orders`;

  constructor(private http: HttpClient) {}

  getById(orderId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.baseUrl}/${orderId}`);
  }

  /** All orders whose stock came from this warehouse, any status — history/oversight view. */
  getByWarehouse(warehouseId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/warehouse/${warehouseId}`);
  }

  /** The actual actionable queue — CONFIRMED orders needing a driver assigned. */
  getAwaitingAssignment(warehouseId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/warehouse/${warehouseId}/awaiting-assignment`);
  }

  assignDriver(orderId: number, request: AssignDriverRequest): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.baseUrl}/${orderId}/assign-driver`, request);
  }
}
