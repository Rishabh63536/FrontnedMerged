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
  allReturns: ReturnRequestResponse[] = [];
  filteredReturns: ReturnRequestResponse[] = [];
  loading = true;

  // Status Filter State
  selectedStatus = 'ALL';
  statusOptions = ['ALL', 'PENDING', 'APPROVED', 'RETURNED', 'REJECTED'];

  // Pagination State
  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 15, 20];

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

  /**
   * Status Mapping
   */
  getStatusDisplay(status: string): string {
    if (!status) return '';
    const upper = status.toUpperCase();
    switch (upper) {
      case 'RESTOCKED':
        return 'RETURNED';
      case 'REQUESTED':
        return 'PENDING';
      default:
        return upper;
    }
  }

  /**
   * Status Filtering
   */
  applyFilter(): void {
    if (this.selectedStatus === 'ALL') {
      this.filteredReturns = [...this.allReturns];
    } else {
      this.filteredReturns = this.allReturns.filter((ret) => {
        const backendStatus = ret.status?.toUpperCase();

        if (this.selectedStatus === 'RETURNED') {
          return backendStatus === 'RESTOCKED';
        }
        if (this.selectedStatus === 'PENDING') {
          return backendStatus === 'REQUESTED';
        }
        return backendStatus === this.selectedStatus;
      });
    }
    this.currentPage = 1; // Always reset to page 1 on filter change
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilter();
  }

  // --- PAGINATION HELPERS ---

  /** Returns records slice for the current page */
  get paginatedReturns(): ReturnRequestResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredReturns.slice(startIndex, startIndex + this.pageSize);
  }

  /** Calculates total available pages */
  get totalPages(): number {
    return Math.ceil(this.filteredReturns.length / this.pageSize) || 1;
  }

  /** Calculates the current starting item index (e.g. 1, 6, 11) */
  get startIndex(): number {
    if (this.filteredReturns.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  /** Calculates the current ending item index (e.g. 5, 10, 12) */
  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredReturns.length);
  }

  /** Generates array of page numbers [1, 2, 3...] for button generation */
  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  /** Switches current page */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /** Handles page size dropdown updates */
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.currentPage = 1; // Reset to page 1 when changing page size
  }

  statusBadgeClass(status: string): string {
    const uiStatus = this.getStatusDisplay(status).toLowerCase();
    return `badge-status-${uiStatus}`;
  }
}