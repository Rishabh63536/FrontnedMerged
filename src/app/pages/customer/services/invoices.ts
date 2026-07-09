import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { InvoiceResponse } from '../models/Invoice.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({
  providedIn: 'root',
})
export class Invoices {
  private baseUrl: string = `${API_BASE_URL}/invoices`;

  constructor(private http: HttpClient) {}

  getByOrder(orderId: number): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.baseUrl}/order/${orderId}`);
  }
}
