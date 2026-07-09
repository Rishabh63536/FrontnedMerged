import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderResponse } from '../../models/Order.module';
import { PaymentResponse } from '../../models/Payment.module';
import { InvoiceResponse } from '../../models/Invoice.module';
import { Orders } from '../../services/orders';
import { Payments } from '../../services/payments';
import { Invoices } from '../../services/invoices';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.html',
  styleUrls: ['./order-detail.css'],
})
export class OrderDetailComponent implements OnInit {
  order: OrderResponse | null = null;
  invoice: InvoiceResponse | null = null;
  payments: PaymentResponse[] = [];

  loading = true;
  processingPayment = false;
  errorMessage: string | null = null;

  private orderId!: number;

  constructor(
    private route: ActivatedRoute,
    private ordersService: Orders,
    private paymentsService: Payments,
    private invoicesService: Invoices,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder();
    this.cdr.detectChanges();
  }

  private loadOrder(): void {
    this.ordersService.getById(this.orderId).subscribe({
      next: (order) => {
        console.log('Order API Response:', order);
        this.order = order;
        this.loading = false;
        this.loadInvoiceIfApplicable();
        this.loadPayments();
        this.cdr.detectChanges();

      },
      error: () => {
        this.errorMessage = 'Order not found.';
        this.loading = false;
      },
    });
  }

  private loadInvoiceIfApplicable(): void {
    // Invoice only exists once advance payment is made (order past PENDING).
    if (this.order && this.order.status !== 'PENDING') {
      this.invoicesService.getByOrder(this.orderId).subscribe({
        next: (inv) => {
          this.invoice = inv;
          this.cdr.detectChanges();
        },
        error: () => {
          // Not an error state worth surfacing — just means invoice generation
          // may have failed server-side; the order itself is still valid.
        },
      });
    }
  }

  private loadPayments(): void {
    this.paymentsService.getByOrder(this.orderId).subscribe({
      next: (list) => {
        this.payments = list;
        this.cdr.detectChanges();
      },
      error: () => {console.log("Issue in loadPayemnets()")},
    });
  }

  get statusBadgeClass(): string {
    return this.order ? `badge-status-${this.order.status.toLowerCase()}` : '';
  }

  get amountPaid(): number {
    // Prefer the backend field if present; fall back to summing payments.
    if (this.order?.orderAmountPaid !== undefined) return this.order.orderAmountPaid;
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  payAdvance(): void {
    if (!this.order) return;
    this.processingPayment = true;
    this.errorMessage = null;

    this.paymentsService.payAdvance(this.order.id).subscribe({
      next: () => {
        this.processingPayment = false;
        this.loadOrder();
         this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Payment failed. Please try again.';
        this.processingPayment = false;
      },
    });
  }

  payFinal(): void {
    if (!this.order) return;
    this.processingPayment = true;
    this.errorMessage = null;

    this.paymentsService.payFinal(this.order.id).subscribe({
      next: () => {
        this.processingPayment = false;
        this.loadOrder();
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Payment failed. Please try again.';
        this.processingPayment = false;
      },
    });
  }
}
