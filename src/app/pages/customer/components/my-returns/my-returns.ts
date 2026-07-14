import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReturnRequests } from '../../services/return-requests';
import { ReturnRequestResponse } from '../../models/Returnrequest.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-my-returns',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-returns.html',
})
export class MyReturnsComponent implements OnInit {
  returns: ReturnRequestResponse[] = [];
  loading = true;

  constructor(
    private loginService: Login,
    private returnRequestsService: ReturnRequests,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const customerId = this.loginService.getRoleProfileId();
    if (!customerId) {
      this.loading = false;
      return;
    }

    this.returnRequestsService.getByCustomer(customerId).subscribe({
      next: (list) => {
        this.returns = list;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  statusBadgeClass(status: string): string {
    return `badge-status-${status.toLowerCase()}`;
  }
}