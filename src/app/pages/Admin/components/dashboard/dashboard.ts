import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Orders } from '../../services/orders';
import { ReturnRequests } from '../../services/return-requests';
import { Warehouses } from '../../services/warehouses';
import { WarehouseManagers } from '../../services/warehouse-managers';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  adminName = '';

  totalOrders = 0;
  pendingReturnsCount = 0;
  unassignedWarehousesCount = 0;
  unassignedManagersCount = 0;

  constructor(
    private loginService: Login,
    private ordersService: Orders,
    private returnRequestsService: ReturnRequests,
    private warehousesService: Warehouses,
    private wmService: WarehouseManagers,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.loginService.getStoredUser();
    this.adminName = user?.name ?? '';

    this.ordersService.getAll().subscribe({
      next: (orders) => {
        this.totalOrders = orders.length;
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

    this.warehousesService.getAll().subscribe({
      next: (warehouses) => {
        this.unassignedWarehousesCount = warehouses.filter((w) => w.managerId === null).length;
        this.cdr.detectChanges();
      },
      error: () => {},
    });

    this.wmService.getAll().subscribe({
      next: (managers) => {
        this.unassignedManagersCount = managers.filter((m) => m.assignedWarehouseId === null).length;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }
}