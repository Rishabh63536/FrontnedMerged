import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Orders } from '../../services/orders';
import { OrderResponse } from '../../models/Order.module';
import { PODResponse } from '../../models/POD.module';
import { API_BASE_URL } from '../../../../core/config/api-config';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.html',
})
export class OrderDetailComponent implements OnInit {
  order: OrderResponse | null = null;
  pod: PODResponse | null = null;
  loading = true;
  errorMessage: string | null = null;

  // photoUrl from the backend is relative ("/pod-images/xyz.jpg") — meant to
  // resolve against whatever host is serving it. Since the frontend runs on
  // a DIFFERENT origin than the backend, we have to prepend the backend's
  // own host here, or the browser tries to load it from the Angular dev
  // server itself (which has no idea what /pod-images/ is) and just shows
  // a broken image.
  private readonly backendOrigin = API_BASE_URL.replace('/api/v1', '');

  get podPhotoFullUrl(): string {
    return this.pod ? `${this.backendOrigin}${this.pod.photoUrl}` : '';
  }

  private orderId!: number;

  constructor(
    private route: ActivatedRoute,
    private ordersService: Orders,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));

    this.ordersService.getById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
        this.cdr.detectChanges();

        // Only worth asking for a POD once the order has actually reached
        // DELIVERED — no point calling it for a PENDING order and getting
        // back null every time.
        if (order.status === 'DELIVERED' || order.status === 'RETURNED') {
          this.ordersService.getPod(this.orderId).subscribe({
            next: (pod) => {
              this.pod = pod;
              this.cdr.detectChanges();
            },
            error: () => {},
          });
        }
      },
      error: () => {
        this.errorMessage = 'Order not found.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  statusBadgeClass(status: string): string {
    return `badge-status-${status.toLowerCase()}`;
  }
}