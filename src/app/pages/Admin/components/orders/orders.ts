import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Orders as OrdersService } from '../../services/orders';
import { OrderResponse, OrderStatus } from '../../models/Order.module';
import { RouterModule } from '@angular/router';

const CANCELLABLE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'ASSIGNED'];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders.html',
})
export class OrdersComponent implements OnInit {
  orders: OrderResponse[] = [];
  loading = true;
  filterStatus: OrderStatus | 'ALL' = 'ALL';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private ordersService: OrdersService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.ordersService.getAll().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredOrders(): OrderResponse[] {
    if (this.filterStatus === 'ALL') return this.orders;
    return this.orders.filter((o) => o.status === this.filterStatus);
  }

  isCancellable(order: OrderResponse): boolean {
    return CANCELLABLE.includes(order.status);
  }

  statusBadgeClass(status: string): string {
    return `badge-status-${status.toLowerCase()}`;
  }

  cancelOrder(orderId: number): void {
    if (!confirm(`Cancel order #${orderId}? This restores stock and frees any assigned driver.`)) return;

    this.ordersService.cancelOrder(orderId).subscribe({
      next: () => {
        this.successMessage = `Order #${orderId} cancelled.`;
        this.loadOrders();
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: () => {
        this.errorMessage = `Could not cancel order #${orderId}.`;
        this.cdr.detectChanges();
      },
    });
  }
}