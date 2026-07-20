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

private readonly taxPercent = 18.0;
private readonly deliveryPercent = 5.0;

get displayAmount(): number {
  if (!this.order) return 0;

  const amountDueBeforeDelivery = this.order.totalAmount * (1 + this.taxPercent / 100);
  const halfShare = this.round2(amountDueBeforeDelivery * 0.5);

  if (this.paymentType === 'advance') {
    return halfShare;
  } else {
    const deliveryFee = this.round2(this.order.totalAmount * (this.deliveryPercent / 100));
    return this.round2(halfShare + deliveryFee);
  }
}

private round2(value: number): number {
  return Math.round(value * 100) / 100;
}

goBack():void{
  history.back();
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


  validateExpiry(expiryInput: any): void {
  const value = expiryInput.value;
  if (!value) return;

  // Match the MM/YY format to safely extract month and year
  const match = value.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
  
  if (match) {
    const inputMonth = parseInt(match[1], 10);
    const inputYear = parseInt('20' + match[2], 10); // Converts '26' to 2026

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-11
    const currentYear = now.getFullYear();

    // Check if the card's expiration date is in the past
    if (inputYear < currentYear || (inputYear === currentYear && inputMonth < currentMonth)) {
      // Merge with existing errors (like pattern or required) and add 'expired'
      expiryInput.control.setErrors({ ...expiryInput.errors, expired: true });
    } else {
      // If valid, remove ONLY the 'expired' error flag
      if (expiryInput.errors?.['expired']) {
        const errors = { ...expiryInput.errors };
        delete errors['expired'];
        expiryInput.control.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
  }
}
}