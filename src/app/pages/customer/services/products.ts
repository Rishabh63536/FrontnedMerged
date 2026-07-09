import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-config';

@Injectable({
  providedIn: 'root',
})
export class Products {
  baseUrl: string = API_BASE_URL;

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/products`);
  }

  getById(id: number): Observable<any> {
    console.log(`${this.baseUrl}/products/${id}`);
    return this.http.get(`${this.baseUrl}/products/${id}`);
  }
}
