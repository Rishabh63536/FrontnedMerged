import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-config';
import { WarehouseCollectionRecordResponse } from '../models/Warehousecollectionrecord.module';

@Injectable({ providedIn: 'root' })
export class Reports {
  private baseUrl: string = `${API_BASE_URL}/reports`;

  constructor(private http: HttpClient) {}

  getWarehouseCollections(): Observable<WarehouseCollectionRecordResponse[]> {
    return this.http.get<WarehouseCollectionRecordResponse[]>(`${this.baseUrl}/warehouse-collections`);
  }
}