import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LaunchProductAtWarehouseRequest, ProductWarehouseResponse, RestockRequest } from '../models/ProductWarehouse.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class ProductWarehouses {
  private baseUrl: string = `${API_BASE_URL}/product-warehouses`;

  constructor(private http: HttpClient) {}

  launch(request: LaunchProductAtWarehouseRequest): Observable<ProductWarehouseResponse> {
    return this.http.post<ProductWarehouseResponse>(this.baseUrl, request);
  }

  /** Global list — VENDOR is permitted here (unlike the warehouse-scoped variant,
   *  which is WM/Admin-only). Used both to show a vendor's own stock AND to
   *  compute "remaining capacity" client-side for the Launch form. */
  getAll(): Observable<ProductWarehouseResponse[]> {
    return this.http.get<ProductWarehouseResponse[]>(this.baseUrl);
  }

  getByProductId(productId: number): Observable<ProductWarehouseResponse> {
    return this.http.get<ProductWarehouseResponse>(`${this.baseUrl}/product/${productId}`);
  }

  restock(id: number, request: RestockRequest): Observable<ProductWarehouseResponse> {
    return this.http.patch<ProductWarehouseResponse>(`${this.baseUrl}/${id}/restock`, request);
  }
}
