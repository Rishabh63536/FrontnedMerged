import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Drivers } from '../../services/drivers';
import { Orders } from '../../services/orders';
import { ReturnRequests } from '../../services/return-requests';
import { Notifications } from '../../services/notifications';
import { DriverResponse } from '../../models/Driver.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  driver: DriverResponse | null = null;
  loading = true;
  togglingAvailability = false;

  activeDeliveriesCount = 0;
  pendingPickupsCount = 0;
  unreadNotificationsCount = 0;

  private driverId!: number;

  constructor(
    private loginService: Login,
    private driversService: Drivers,
    private ordersService: Orders,
    private returnRequestsService: ReturnRequests,
    private notificationsService: Notifications,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const driverId = this.loginService.getRoleProfileId();
    if (!driverId) {
      this.loading = false;
      return;
    }
    this.driverId = driverId;

    this.driversService.getById(driverId).subscribe({
      next: (d) => {
        this.driver = d;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    this.ordersService.getByDriver(driverId).subscribe({
      next: (orders) => {
        this.activeDeliveriesCount = orders.filter(
          (o) => o.status === 'ASSIGNED' || o.status === 'IN_TRANSIT',
        ).length;
        this.cdr.detectChanges();
      },
      error: () => {},
    });

    this.returnRequestsService.getByDriver(driverId).subscribe({
      next: (returns) => {
        this.pendingPickupsCount = returns.filter((r) => r.status === 'APPROVED').length;
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

  toggleAvailability(): void {
    if (!this.driver) return;
    this.togglingAvailability = true;
    const newAvailable = !this.driver.available;

    this.driversService.updateAvailability(this.driverId, { available: newAvailable }).subscribe({
      next: (updated) => {
        this.driver = updated;
        this.togglingAvailability = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.togglingAvailability = false;
        this.cdr.detectChanges();
      },
    });
  }
}
