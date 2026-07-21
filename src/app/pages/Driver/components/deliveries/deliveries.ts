import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Orders } from '../../services/orders';
import { OrderResponse } from '../../models/Order.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deliveries.html',
})
export class DeliveriesComponent implements OnInit {
  orders: OrderResponse[] = [];
  loading = true;

  startingId: number | null = null;
  completingId: number | null = null;
  selectedPhoto: { [orderId: number]: File | null } = {};
  errorMessage: { [orderId: number]: string | null } = {};
  successMessage: string | null = null;

  private driverId!: number;

  constructor(
    private loginService: Login,
    private ordersService: Orders,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const driverId = this.loginService.getRoleProfileId();
    if (!driverId) {
      this.loading = false;
      return;
    }
    this.driverId = driverId;
    this.loadOrders();
  }

  private loadOrders(): void {
    this.ordersService.getByDriver(this.driverId).subscribe({
      next: (orders) => {
        this.orders = (orders || []).filter(
          (o) => o.status === 'ASSIGNED' || o.status === 'IN_TRANSIT'
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /** Helper to check if customer has completed final payment */
  isFullyPaid(order: OrderResponse): boolean {
    return (order.amountPaid ?? 0) >= (order.totalAmount ?? 0);
  }

  /** Helper to compute remaining balance owed by customer */
  getRemainingBalance(order: OrderResponse): number {
    return Math.max(0, (order.totalAmount ?? 0) - (order.amountPaid ?? 0));
  }

  /** Generates direct Google Maps URL for rapid mobile navigation */
  getGoogleMapsUrl(address: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  startDelivery(orderId: number): void {
    this.startingId = orderId;
    this.ordersService.startDelivery(orderId).subscribe({
      next: () => {
        this.successMessage = `Order #${orderId} is now in transit.`;
        this.startingId = null;
        this.loadOrders();
        this.clearSuccessSoon();
      },
      error: () => {
        this.errorMessage[orderId] = 'Could not start delivery.';
        this.startingId = null;
        this.cdr.detectChanges();
      },
    });
  }

  onPhotoSelected(orderId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedPhoto[orderId] = input.files?.[0] ?? null;
  }

  completeDelivery(orderId: number): void {
    const photo = this.selectedPhoto[orderId];
    if (!photo) {
      this.errorMessage[orderId] = 'A delivery photo is required.';
      this.cdr.detectChanges();
      return;
    }

    this.completingId = orderId;
    this.errorMessage[orderId] = null;

    this.ordersService.completeDelivery(orderId, photo).subscribe({
      next: () => {
        this.successMessage = `Order #${orderId} marked as delivered.`;
        this.completingId = null;
        this.loadOrders();
        this.clearSuccessSoon();
      },
      error: (err) => {
        this.errorMessage[orderId] = err?.error?.Message || 'Could not complete delivery.';
        this.completingId = null;
        this.cdr.detectChanges();
      },
    });
  }

  private clearSuccessSoon(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 4000);
  }
}