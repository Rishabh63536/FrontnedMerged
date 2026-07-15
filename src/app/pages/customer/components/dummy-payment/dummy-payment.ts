import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Orders } from '../../services/orders';
import { Payments } from '../../services/payments';
import { OrderResponse } from '../../models/Order.module';

@Component({
  selector: 'app-dummy-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dummy-payment.html',
})
export class DummyPaymentComponent implements OnInit {
  order: OrderResponse | null = null;
  paymentType: 'advance' | 'final' = 'advance';
  loading = true;
  processing = false;
  errorMessage: string | null = null;

  private orderId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: Orders,
    private paymentsService: Payments,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    const type = this.route.snapshot.paramMap.get('type');
    this.paymentType = type === 'final' ? 'final' : 'advance';

    this.ordersService.getById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Order not found.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get displayAmount(): number {
    return this.order ? this.order.totalAmount * 0.5 : 0;
  }

  pay(form: NgForm): void {
    if (!form.valid || !this.order) return;

    this.processing = true;
    this.errorMessage = null;

    // Brief artificial delay purely for a "processing payment" feel
    // doesn't affect what's actually charged, that's still computed
    // entirely server-side the moment the real call below fires.
    setTimeout(() => {
      const call = this.paymentType === 'advance'
        ? this.paymentsService.payAdvance(this.orderId)
        : this.paymentsService.payFinal(this.orderId);

      call.subscribe({
        next: () => {
          this.router.navigate(['/customer/orders', this.orderId]);
        },
        error: (err) => {
          this.errorMessage = err?.error?.Message || 'Payment failed. Please try again.';
          this.processing = false;
          this.cdr.detectChanges();
        },
      });
    }, 900);
  }
}