import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductDTO } from '../../models/Product.module';
import { Products } from '../../services/products';
import { Orders } from '../../services/orders';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css'],
})
export class ProductDetailsComponent implements OnInit {
  product: ProductDTO | null = null;
  loading = true;
  placingOrder = false;
  errorMessage: string | null = null;

  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: Products,
    private ordersService: Orders,
    private loginService: Login,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getById(productId).subscribe({
      next: (result) => {
        this.product = result;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Product not found.';
        this.loading = false;
      },
    });
  }

  get totalPrice(): number {
    if (!this.product) return 0;
    return this.product.productPrice * this.quantity;
  }

  placeOrder(form: NgForm): void {
    if (!form.valid || !this.product) return;

    const customerId = this.loginService.getRoleProfileId();
    if (!customerId) {
      this.errorMessage = 'Session expired. Please log in again.';
      return;
    }

    this.placingOrder = true;
    this.errorMessage = null;

    this.ordersService
      .placeOrder({
        customerId,
        productId: this.product.productId,
        quantity: this.quantity,
        shippingAddress: form.value.shippingAddress,
      })
      .subscribe({
        next: (order) => {
          this.router.navigate(['/customer/orders', order.id]);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage =
            err?.status === 409
              ? 'Not enough stock available for this quantity.'
              : 'Could not place order. Please try again.';
          this.placingOrder = false;
        },
      });
  }
}
