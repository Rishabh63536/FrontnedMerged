import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Products as ProductsService } from '../../services/products';
import { ProductWarehouses } from '../../services/product-warehouses';
import { ProductResponse } from '../../models/Product.module';
import { ProductWarehouseResponse } from '../../models/ProductWarehouse.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products.html',
})
export class ProductsComponent implements OnInit {
  products: ProductResponse[] = [];
  // Map of productId -> its stock entry, only present for launched products.
  stockByProductId: Map<number, ProductWarehouseResponse> = new Map();
  loading = true;

  showCreateForm = false;
  editingProductId: number | null = null;
  restockingProductId: number | null = null;
  restockAmount: { [productId: number]: number } = {};

  errorMessage: string | null = null;
  successMessage: string | null = null;

  private vendorId!: number;

  constructor(
    private loginService: Login,
    private productsService: ProductsService,
    private pwService: ProductWarehouses,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const vendorId = this.loginService.getRoleProfileId();
    if (!vendorId) {
      this.loading = false;
      return;
    }
    this.vendorId = vendorId;
    this.loadAll();
  }

  private loadAll(): void {
    this.productsService.getByVendor(this.vendorId).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;

        this.pwService.getAll().subscribe({
          next: (allStock) => {
            this.stockByProductId = new Map(
              allStock.filter((pw) => pw.vendorId === this.vendorId).map((pw) => [pw.productId, pw]),
            );
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
  }

  isLaunched(productId: number): boolean {
    return this.stockByProductId.has(productId);
  }

  getStock(productId: number): ProductWarehouseResponse | undefined {
    return this.stockByProductId.get(productId);
  }

  // ── Create ──────────────────────────────────────────────
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.errorMessage = null;
  }

  createProduct(form: NgForm): void {
    if (!form.valid) return;
    const v = form.value;

    this.productsService
      .create({
        productName: v.productName,
        productPrice: v.productPrice,
        productDescription: v.productDescription,
        vendorId: this.vendorId,
      })
      .subscribe({
        next: () => {
          this.successMessage = 'Product created. Launch it at a warehouse to make it orderable.';
          this.showCreateForm = false;
          form.resetForm();
          this.loadAll();
          this.clearSuccessSoon();
        },
        error: () => {
          this.errorMessage = 'Could not create product — you may already have one with this name.';
          this.cdr.detectChanges();
        },
      });
  }

  // ── Edit ────────────────────────────────────────────────
  toggleEdit(id: number): void {
    this.editingProductId = this.editingProductId === id ? null : id;
    this.errorMessage = null;
  }

  saveEdit(id: number, form: NgForm): void {
    if (!form.valid) return;
    const v = form.value;
    this.productsService
      .update(id, { productName: v.productName, productPrice: v.productPrice, productDescription: v.productDescription })
      .subscribe({
        next: () => {
          this.successMessage = 'Product updated.';
          this.editingProductId = null;
          this.loadAll();
          this.clearSuccessSoon();
        },
        error: () => {
          this.errorMessage = 'Could not update product.';
          this.cdr.detectChanges();
        },
      });
  }

  // ── Delete ──────────────────────────────────────────────
  deleteProduct(id: number, name: string): void {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    this.productsService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Product deleted.';
        this.loadAll();
        this.clearSuccessSoon();
      },
      error: () => {
        this.errorMessage = 'Could not delete — it may already be launched with existing orders.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Restock (only for already-launched products) ─────────
  toggleRestock(productId: number): void {
    this.restockingProductId = this.restockingProductId === productId ? null : productId;
    this.errorMessage = null;
  }

  confirmRestock(productId: number): void {
    const stock = this.getStock(productId);
    const amount = this.restockAmount[productId];
    if (!stock || !amount || amount <= 0) {
      this.errorMessage = 'Enter a positive amount.';
      this.cdr.detectChanges();
      return;
    }

    this.pwService.restock(stock.id, { amount }).subscribe({
      next: () => {
        this.successMessage = 'Stock updated.';
        this.restockingProductId = null;
        this.loadAll();
        this.clearSuccessSoon();
      },
      error: (err) => {
        this.errorMessage = err?.status === 400 ? 'That would exceed max stock capacity.' : 'Could not restock.';
        this.cdr.detectChanges();
      },
    });
  }

  private clearSuccessSoon(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 4000);
  }
}
