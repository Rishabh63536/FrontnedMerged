import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderResponse } from '../../models/Order.module';
import { Orders } from '../../services/orders';
import { Login } from '../../../../core/services/login';

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
  loading = true;

  constructor(
    private ordersService: Orders,
    private loginService: Login,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const customerId = this.loginService.getRoleProfileId();
    if (!customerId) return;

    this.ordersService.getActiveByCustomer(customerId).subscribe({
      next: (orders) => {
        this.activeOrders = orders;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => (this.loading = false),
    });

    this.ordersService.getPastByCustomer(customerId).subscribe({
      next: (orders) =>{
         this.pastOrders = orders;
         this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  get displayedOrders(): OrderResponse[] {
    return this.activeTab === 'active' ? this.activeOrders : this.pastOrders;
  }

  viewOrder(orderId: number): void {
    this.router.navigate(['/customer/orders', orderId]);
  }

  statusBadgeClass(status: string): string {
    return `badge-status-${status.toLowerCase()}`;
  }
}
