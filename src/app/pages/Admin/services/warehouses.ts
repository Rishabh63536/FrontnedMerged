import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateWarehouseRequest, UpdateWarehouseRequest, WarehouseResponse } from '../models/Warehouse.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class Warehouses {
  private baseUrl: string = `${API_BASE_URL}/warehouses`;

  constructor(private http: HttpClient) {}

  create(request: CreateWarehouseRequest): Observable<WarehouseResponse> {
    return this.http.post<WarehouseResponse>(this.baseUrl, request);
  }

  getAll(): Observable<WarehouseResponse[]> {
    return this.http.get<WarehouseResponse[]>(this.baseUrl);
  }

  update(id: number, request: UpdateWarehouseRequest): Observable<WarehouseResponse> {
    return this.http.put<WarehouseResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
