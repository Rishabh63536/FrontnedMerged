import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Orders } from '../../services/orders';
import { OrderResponse } from '../../models/Order.module';
import { OrderStatus as OrderStat } from "../../models/Order.module";

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-status.html'
})
export class OrderStatus implements OnInit {
  orderId!: number;
  order?: OrderResponse;
  loading = true;
  errorMessage = '';

  statusSteps: OrderStat[] = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];

  constructor(
    private route: ActivatedRoute,
    private orderService: Orders,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('--- [TRACKING] OrderStatus Component Mounted ---');

    // Using active subscription to safely catch parameters across all layout levels
    this.route.paramMap.subscribe({
      next: (params) => {
        // 1. Try finding 'id' in current route definition
        let idParam = params.get('id');
        console.log('[TRACKING] Current route level :id value:', idParam);

        // 2. Fallback: If null, check if parameter resides in a parent layout route structure
        if (!idParam && this.route.parent) {
          idParam = this.route.parent.snapshot.paramMap.get('id');
          console.log('[TRACKING] Parent layout wrapper level :id value:', idParam);
        }

        if (idParam) {
          this.orderId = +idParam;
          this.fetchOrderDetails();
        } else {
          console.error('[TRACKING] Parameter extraction failure: ":id" was not found anywhere in the active URL structure.');
          this.loading = false;
          this.errorMessage = 'System Route Failure: Unable to locate Waybill ID parameter.';
          this.cdr.detectChanges();
        }
      }
    });
  }

  fetchOrderDetails(): void {
    console.log(`[TRACKING] Dispatching API request to backend for Order ID: ${this.orderId}`);
    this.loading = true;
    this.cdr.detectChanges();

    this.orderService.getById(this.orderId).subscribe({
      next: (orderData) => {
        console.log('[TRACKING] Received Live Sync Payload from Backend API:', orderData);
        if (orderData) {
          this.order = orderData;
        } else {
          this.errorMessage = `Order #${this.orderId} could not be found.`;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[TRACKING] HTTP Transmission Error during live tracking sync:', err);
        this.errorMessage = 'Failed to retrieve real-time tracking updates.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isStepCompleted(step: OrderStat): boolean {
    if (!this.order || this.order.status === 'CANCELLED' || this.order.status === 'RETURNED') return false;
    const currentIdx = this.statusSteps.indexOf(this.order.status);
    const stepIdx = this.statusSteps.indexOf(step);
    return stepIdx <= currentIdx;
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return '';
    return status.replace('_', ' ');
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (!status) return 'bg-light text-dark';
    
    const badgeMap: Record<string, string> = {
      PENDING: 'bg-warning text-dark',
      CONFIRMED: 'bg-info text-dark',
      ASSIGNED: 'bg-primary text-white',
      IN_TRANSIT: 'bg-info text-white bg-gradient',
      DELIVERED: 'bg-success text-white',
      CANCELLED: 'bg-danger text-white',
      RETURNED: 'bg-secondary text-white'
    };

    return badgeMap[status] || 'bg-light text-dark';
  }

  get amountPaid(): number {
    return this.order?.orderAmountPaid ?? 0;
  }
}