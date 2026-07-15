import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { OrderResponse } from '../models/Order.module';
import { API_BASE_URL } from '../../../core/config/api-config';
import { PODResponse } from '../models/POD.module';

@Injectable({ providedIn: 'root' })
export class Orders {
  private baseUrl: string = `${API_BASE_URL}/orders`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrderResponse[]> {
    console.log("enetering the getAll method");
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/all`);
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.baseUrl}/${orderId}/cancel`, {});
  }

  getById(orderId: number): Observable<OrderResponse> {
  return this.http.get<OrderResponse>(`${this.baseUrl}/${orderId}`);
}
 
getPod(orderId: number): Observable<PODResponse | null> {
  return this.http.get<PODResponse>(`${this.baseUrl}/${orderId}/pod`).pipe(
    catchError(() => of(null))
  );
}
}