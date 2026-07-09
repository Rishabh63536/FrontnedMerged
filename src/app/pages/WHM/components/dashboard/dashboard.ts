import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Warehouses } from '../../services/warehouses';
import { Orders } from '../../services/orders';
import { ReturnRequests } from '../../services/return-requests';
import { ProductWarehouses } from '../../services/product-warehouses';
import { Notifications } from '../../services/notifications';
import { WarehouseResponse } from '../../models/Warehouse.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  managerName = '';
  warehouse: WarehouseResponse | null = null;
  loading = true;

  awaitingAssignmentCount = 0;
  pendingReturnsCount = 0;
  lowStockCount = 0;
  unreadNotificationsCount = 0;

  urgentOrders: any[] = [];
  lowStockItems: any[] = [];

  constructor(
    private loginService: Login,
    private warehousesService: Warehouses,
    private ordersService: Orders,
    private returnRequestsService: ReturnRequests,
    private productWarehousesService: ProductWarehouses,
    private notificationsService: Notifications,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.loginService.getStoredUser();
    this.managerName = user?.name ?? '';

    const warehouseId = this.loginService.getWarehouseId();
    if (!warehouseId) {
      this.loading = false;
      return;
    }

    this.warehousesService.getById(warehouseId).subscribe({
      next: (wh) => {
        this.warehouse = wh;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    this.ordersService.getAwaitingAssignment(warehouseId).subscribe({
      next: (orders) => {
        this.awaitingAssignmentCount = orders.length;
        this.urgentOrders = orders ? orders.slice(0, 5) : [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });

    this.returnRequestsService.getPending().subscribe({
      next: (returns) => {
        this.pendingReturnsCount = returns.length;
        this.cdr.detectChanges();
      },
      error: () => {},
    });

    this.productWarehousesService.getLowStockByWarehouse(warehouseId).subscribe({
      next: (items) => {
        this.lowStockCount = items.length;
        this.lowStockItems = items ? items.slice(0, 5) : [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });

    const userId = this.loginService.getUserId();
    if (userId) {
      this.notificationsService.getUnreadForUser(userId).subscribe({
        next: (list) => {
          this.unreadNotificationsCount = list.length;
          this.cdr.detectChanges();
        },
        error: () => {},
      });
    }
  }
}