import { Injectable } from "@angular/core";
import { API_BASE_URL } from "../../../core/config/api-config";
import { HttpClient } from "@angular/common/http";
import { CreateReturnRequestRequest, ReturnRequestResponse } from "../models/Returnrequest.module";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ReturnRequests {

  private baseUrl: string = `${API_BASE_URL}/return-requests`;

  constructor(private http: HttpClient) {}

  create(returnRequest: CreateReturnRequestRequest): Observable<ReturnRequestResponse> {
    return this.http.post<ReturnRequestResponse>(this.baseUrl, returnRequest);
  }

  getByCustomer(customerId: number): Observable<ReturnRequestResponse[]> {
    return this.http.get<ReturnRequestResponse[]>(`${this.baseUrl}/customer/${customerId}`);
  }
}