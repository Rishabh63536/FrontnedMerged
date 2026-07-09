import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WarehouseResponse } from '../models/Warehouse.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({
  providedIn: 'root',
})
export class Warehouses {
  private baseUrl: string = `${API_BASE_URL}/warehouses`;

  constructor(private http: HttpClient) {}

  getById(warehouseId: number): Observable<WarehouseResponse> {
    return this.http.get<WarehouseResponse>(`${this.baseUrl}/${warehouseId}`);
  }
}
