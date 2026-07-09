import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Warehouses } from '../../services/warehouses';
import { Orders } from '../../services/orders';
import { Drivers } from '../../services/drivers';
import { OrderResponse } from '../../models/Order.module';
import { DriverResponse } from '../../models/Driver.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-orders-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-queue.html',
})
export class OrdersQueueComponent implements OnInit {
  orders: OrderResponse[] = [];
  availableDrivers: DriverResponse[] = [];
  warehouseLocation = '';

  loading = true;
  assigningOrderId: number | null = null; // which order's dropdown is open
  selectedDriverId: { [orderId: number]: number } = {};
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // ── Search + pagination ──
  searchTerm = '';
  filteredOrders: OrderResponse[] = [];
  pagedOrders: OrderResponse[] = [];
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  private warehouseId!: number;

  constructor(
    private loginService: Login,
    private warehousesService: Warehouses,
    private ordersService: Orders,
    private driversService: Drivers,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const warehouseId = this.loginService.getWarehouseId();
    if (!warehouseId) {
      this.loading = false;
      return;
    }
    this.warehouseId = warehouseId;

    this.warehousesService.getById(warehouseId).subscribe({
      next: (wh) => {
        this.warehouseLocation = wh.location;
        // Drivers matched by city AFTER we know the warehouse's own location.
        this.driversService.getAvailableByLocation(wh.location).subscribe({
          next: (drivers) => {
            this.availableDrivers = drivers;
            this.cdr.detectChanges();
          },
          error: () => {},
        });
      },
      error: () => {},
    });

    this.loadOrders();
  }

  private loadOrders(): void {
    this.ordersService.getAwaitingAssignment(this.warehouseId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /** Filter by search term, then slice the current page. */
  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredOrders = !term
      ? this.orders
      : this.orders.filter(
          (o) =>
            String(o.id).includes(term) ||
            o.productNameSnapshot.toLowerCase().includes(term) ||
            o.customerName.toLowerCase().includes(term) ||
            o.shippingAddress.toLowerCase().includes(term),
        );

    this.totalPages = Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedOrders = this.filteredOrders.slice(start, start + this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 1; // new search always starts on page 1
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilters();
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  openAssign(orderId: number): void {
    this.assigningOrderId = this.assigningOrderId === orderId ? null : orderId;
    this.errorMessage = null;
  }

  confirmAssign(orderId: number): void {
    const driverId = this.selectedDriverId[orderId];
    if (!driverId) {
      this.errorMessage = 'Select a driver first.';
      this.cdr.detectChanges();
      return;
    }

    this.ordersService.assignDriver(orderId, { driverId }).subscribe({
      next: () => {
        this.successMessage = `Driver assigned to order #${orderId}.`;
        this.assigningOrderId = null;
        this.loadOrders(); // order leaves the queue once ASSIGNED
        // Assigned driver is no longer available for other orders in this session.
        this.availableDrivers = this.availableDrivers.filter((d) => d.id !== driverId);
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err) => {
        this.errorMessage =
          err?.status === 400 ? 'That driver is no longer available. Pick another.' : 'Could not assign driver.';
        this.cdr.detectChanges();
      },
    });
  }
}
