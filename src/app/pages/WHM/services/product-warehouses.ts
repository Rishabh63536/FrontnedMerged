import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductWarehouseResponse, RestockRequest, UpdateProductWarehouseRequest } from '../models/ProductWarehouse.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({
  providedIn: 'root',
})
export class ProductWarehouses {
  private baseUrl: string = `${API_BASE_URL}/product-warehouses`;

  constructor(private http: HttpClient) {}

  getByWarehouseId(warehouseId: number): Observable<ProductWarehouseResponse[]> {
    return this.http.get<ProductWarehouseResponse[]>(`${this.baseUrl}/warehouse/${warehouseId}`);
  }

  getLowStockByWarehouse(warehouseId: number): Observable<ProductWarehouseResponse[]> {
    return this.http.get<ProductWarehouseResponse[]>(`${this.baseUrl}/low-stock/warehouse/${warehouseId}`);
  }

  restock(id: number, request: RestockRequest): Observable<ProductWarehouseResponse> {
    return this.http.patch<ProductWarehouseResponse>(`${this.baseUrl}/${id}/restock`, request);
  }

  updateThresholds(id: number, request: UpdateProductWarehouseRequest): Observable<ProductWarehouseResponse> {
    return this.http.put<ProductWarehouseResponse>(`${this.baseUrl}/${id}`, request);
  }
}
