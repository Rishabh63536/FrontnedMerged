import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderResponse } from '../models/Order.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class Orders {
  private baseUrl: string = `${API_BASE_URL}/orders`;

  constructor(private http: HttpClient) {}

  getByDriver(driverId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/driver/${driverId}`);
  }

  startDelivery(orderId: number): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.baseUrl}/${orderId}/start-delivery`, {});
  }

  /** Photo is REQUIRED by the backend for this one (unlike return pickup's optional photo). */
  completeDelivery(orderId: number, photo: File): Observable<OrderResponse> {
    const formData = new FormData();
    formData.append('photo', photo);
    return this.http.patch<OrderResponse>(`${this.baseUrl}/${orderId}/complete-delivery`, formData);
  }
}
