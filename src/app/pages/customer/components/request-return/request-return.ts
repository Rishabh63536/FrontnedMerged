import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Orders } from '../../services/orders';
import { ReturnRequests } from '../../services/return-requests';
import { OrderResponse } from '../../models/Order.module';
import { Login } from '../../../../core/services/login';
import { ReturnReason } from '../../models/Returnrequest.module';

@Component({
  selector: 'app-request-return',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './request-return.html',
})
export class RequestReturnComponent implements OnInit {
  order: OrderResponse | null = null;
  loading = true;
  submitting = false;
  errorMessage: string | null = null;

  // Computed the same way the backend validates it — sum of returnQuantity
  // across this order's existing non-rejected return requests, subtracted
  // from what was originally ordered. Shown so the customer isn't guessing
  // at a number the backend will just reject anyway.
  alreadyClaimedQuantity = 0;
  get remainingReturnable(): number {
    return this.order ? this.order.quantity - this.alreadyClaimedQuantity : 0;
  }

  orderId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: Orders,
    private returnRequestsService: ReturnRequests,
    private loginService: Login,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));

    this.ordersService.getById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
        this.cdr.detectChanges();
        this.loadExistingReturns();
      },
      error: () => {
        this.errorMessage = 'Order not found.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadExistingReturns(): void {
    const customerId = this.loginService.getRoleProfileId();
    if (!customerId) return;

    // No "get returns by order" endpoint exists — reusing the customer-wide
    // list and filtering client-side, same approach used elsewhere (e.g.
    // Vendor's remaining-capacity hint) when a narrower endpoint doesn't exist.
    this.returnRequestsService.getByCustomer(customerId).subscribe({
      next: (all) => {
        this.alreadyClaimedQuantity = all
          .filter((r) => r.orderId === this.orderId && r.status !== 'REJECTED')
          .reduce((sum, r) => sum + r.returnQuantity, 0);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  submit(form: NgForm): void {
    if (!form.valid || !this.order) return;
    const v = form.value;

    if (v.returnQuantity > this.remainingReturnable) {
      this.errorMessage = `Only ${this.remainingReturnable} unit(s) remain eligible for return.`;
      this.cdr.detectChanges();
      return;
    }

    const customerId = this.loginService.getRoleProfileId();
    if (!customerId) {
      this.errorMessage = 'Session expired. Please log in again.';
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    this.returnRequestsService
      .create({
        customerId,
        orderId: this.orderId,
        returnQuantity: v.returnQuantity,
        reason: v.reason as ReturnReason,
        notes: v.notes || undefined,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/customer/returns']);
        },
        error: (err) => {
          this.errorMessage = err?.error?.Message || 'Could not submit return request.';
          this.submitting = false;
          this.cdr.detectChanges();
        },
      });
  }
}