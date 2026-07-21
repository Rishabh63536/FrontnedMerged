import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderResponse } from '../../models/Order.module';
import { Orders } from '../../services/orders';
import { ReturnRequests } from '../../services/return-requests';
import { ReturnRequestResponse } from '../../models/Returnrequest.module';
import { Login } from '../../../../core/services/login';
import { OrderStatus } from '../../models/Order.module';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css'],
})
export class MyOrdersComponent implements OnInit {
  activeTab: 'active' | 'past' = 'active';
  activeOrders: OrderResponse[] = [];
  pastOrders: OrderResponse[] = [];
  returnRequests: ReturnRequestResponse[] = [];
  loading = true;

  // Status Filter State
  selectedStatus = 'ALL';

  // Pagination State
  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 15, 20];

  constructor(
    private ordersService: Orders,
    private returnRequestsService: ReturnRequests,
    private loginService: Login,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const customerId = this.loginService.getRoleProfileId();
    if (!customerId) {
      this.loading = false;
      return;
    }

    // Fetch Active Orders, Past Orders, and Return Requests simultaneously
    forkJoin({
      active: this.ordersService.getActiveByCustomer(customerId),
      past: this.ordersService.getPastByCustomer(customerId),
      returns: this.returnRequestsService.getByCustomer(customerId),
    }).subscribe({
      next: ({ active, past, returns }) => {
        this.activeOrders = active || [];
        this.returnRequests = returns || [];

        // Cross-reference past orders with return requests
       this.pastOrders = (past || []).map((order) => {
  const matchedReturn = this.returnRequests.find((r) => r.orderId === order.id);
  if (matchedReturn) {
    return {
      ...order,
      // Cast the ReturnStatus to OrderStatus so TypeScript allows the UI override
      status: matchedReturn.status as unknown as OrderStatus, 
    };
  }
  return order;
});

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /** Unified status display label generator for OrderStatus & ReturnStatus */
  getStatusDisplay(status: string): string {
    if (!status) return '';
    const upper = status.toUpperCase();
    switch (upper) {
      case 'RESTOCKED':
      case 'RETURNED':
        return 'RETURNED';
      case 'REQUESTED':
        return 'RETURN REQUESTED';
      case 'APPROVED':
        return 'RETURN APPROVED';
      case 'REJECTED':
        return 'RETURN REJECTED';
      default:
        return upper;
    }
  }

  get rawTabOrders(): OrderResponse[] {
    return this.activeTab === 'active' ? this.activeOrders : this.pastOrders;
  }

  get availableStatuses(): string[] {
    const mappedStatuses = this.rawTabOrders
      .map((o) => this.getStatusDisplay(o.status))
      .filter((s): s is string => !!s);
    return ['ALL', ...Array.from(new Set(mappedStatuses))];
  }

  get currentTabOrders(): OrderResponse[] {
    if (this.selectedStatus === 'ALL') {
      return this.rawTabOrders;
    }
    return this.rawTabOrders.filter(
      (order) => this.getStatusDisplay(order.status) === this.selectedStatus
    );
  }

  get paginatedOrders(): OrderResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.currentTabOrders.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.currentTabOrders.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.currentTabOrders.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.currentTabOrders.length);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  setActiveTab(tab: 'active' | 'past'): void {
    this.activeTab = tab;
    this.selectedStatus = 'ALL';
    this.currentPage = 1;
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.currentPage = 1;
  }

  viewOrder(orderId: number): void {
    this.router.navigate(['/customer/orders', orderId]);
  }

  statusBadgeClass(status: string): string {
    const display = this.getStatusDisplay(status).toLowerCase().replace(/\s+/g, '_');
    return `badge-status-${display}`;
  }
}