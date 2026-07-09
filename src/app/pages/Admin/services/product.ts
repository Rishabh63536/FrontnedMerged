import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductResponse } from '../models/Product.module';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private apiUrl = `${API_BASE_URL}/product-warehouses`;

  constructor(private http: HttpClient) { }

  getProducts(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.apiUrl);
  }
}