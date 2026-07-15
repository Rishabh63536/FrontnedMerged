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
  allReturns: ReturnRequestResponse[] = []; // Master data cache
  filteredReturns: ReturnRequestResponse[] = []; // Screen-filtered data
  loading = true;

  // Pagination & Filtering state
  currentPage = 1;
  pageSize = 5;
  selectedStatus = 'ALL';
  
  // Available status enums from your platform lifecycle
  statusOptions = ['ALL', 'PENDING', 'RESTOCKED', 'REJECTED'];

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
        this.allReturns = list || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Handles filtering data rows based on Status selection
  applyFilter(): void {
    if (this.selectedStatus === 'ALL') {
      this.filteredReturns = [...this.allReturns];
    } else {
      this.filteredReturns = this.allReturns.filter(
        (ret) => ret.status?.toUpperCase() === this.selectedStatus.toUpperCase()
      );
    }
    this.currentPage = 1; // Always reset map to first page on filter change
  }

  // Status modifier helper
  onStatusFilterChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilter();
  }

  // Slice helper logic to fetch exactly what page needs to render
  get paginatedReturns(): ReturnRequestResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredReturns.slice(startIndex, startIndex + this.pageSize);
  }

  // Calculate total pages dynamically
  get totalPages(): number {
    return Math.ceil(this.filteredReturns.length / this.pageSize) || 1;
  }

  // Page switching actions
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  statusBadgeClass(status: string): string {
    return `badge-status-${status.toLowerCase()}`;
  }
}