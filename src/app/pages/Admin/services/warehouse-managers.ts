import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WarehouseManagerResponse } from '../models/WarehouseManager.module';
import { WarehouseAssignmentRequest } from '../models/Warehouse.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class WarehouseManagers {
  private baseUrl: string = `${API_BASE_URL}/warehouse-managers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<WarehouseManagerResponse[]> {
    return this.http.get<WarehouseManagerResponse[]>(this.baseUrl);
  }

  assignWarehouse(id: number, request: WarehouseAssignmentRequest): Observable<WarehouseManagerResponse> {
    return this.http.patch<WarehouseManagerResponse>(`${this.baseUrl}/${id}/assign-warehouse`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
