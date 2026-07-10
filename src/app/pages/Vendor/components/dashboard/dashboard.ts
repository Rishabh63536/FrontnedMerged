import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Products } from '../../services/products';
import { ProductWarehouses } from '../../services/product-warehouses';
import { Notifications } from '../../services/notifications';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  vendorName = '';
  loading = true;

  totalProducts = 0;
  launchedCount = 0;
  notLaunchedCount = 0;
  lowStockCount = 0;
  unreadNotificationsCount = 0;

  private vendorId!: number;

  constructor(
    private loginService: Login,
    private productsService: Products,
    private pwService: ProductWarehouses,
    private notificationsService: Notifications,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.loginService.getStoredUser();
    this.vendorName = user?.name ?? '';

    const vendorId = this.loginService.getRoleProfileId();
    if (!vendorId) {
      this.loading = false;
      return;
    }
    this.vendorId = vendorId;

    this.productsService.getByVendor(vendorId).subscribe({
      next: (products) => {
        this.totalProducts = products.length;
        this.loading = false;

        // Cross-reference against launched stock entries to split launched/not.
        this.pwService.getAll().subscribe({
          next: (allStock) => {
            const myLaunchedProductIds = new Set(
              allStock.filter((pw) => pw.vendorId === this.vendorId).map((pw) => pw.productId),
            );
            this.launchedCount = products.filter((p) => myLaunchedProductIds.has(p.productId)).length;
            this.notLaunchedCount = this.totalProducts - this.launchedCount;
            this.lowStockCount = allStock.filter(
              (pw) => pw.vendorId === this.vendorId && pw.belowRol,
            ).length;
            this.cdr.detectChanges();
          },
          error: () => {},
        });

        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
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
