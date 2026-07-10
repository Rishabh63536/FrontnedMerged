import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Products } from '../../services/products';
import { Warehouses } from '../../services/warehouses';
import { ProductWarehouses } from '../../services/product-warehouses';
import { ProductResponse } from '../../models/Product.module';
import { WarehouseResponse } from '../../models/Warehouse.module';

@Component({
  selector: 'app-launch-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './launch-product.html',
})
export class LaunchProductComponent implements OnInit {
  product: ProductResponse | null = null;
  warehouses: WarehouseResponse[] = [];
  loading = true;
  submitting = false;
  errorMessage: string | null = null;

  selectedWarehouseId: number | null = null;
  // Capacity hint state — recomputed whenever the selected warehouse changes.
  selectedWarehouseCapacity = 0;
  allocatedAtSelectedWarehouse = 0;
  get remainingCapacity(): number {
    return this.selectedWarehouseCapacity - this.allocatedAtSelectedWarehouse;
  }

  private productId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: Products,
    private warehousesService: Warehouses,
    private pwService: ProductWarehouses,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('productId'));

    this.productsService.getById(this.productId).subscribe({
      next: (p) => {
        this.product = p;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    this.warehousesService.getAll().subscribe({
      next: (list) => {
        this.warehouses = list;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  onWarehouseChange(): void {
    if (!this.selectedWarehouseId) return;
    const warehouse = this.warehouses.find((w) => w.id === this.selectedWarehouseId);
    this.selectedWarehouseCapacity = warehouse?.capacity ?? 0;

    // Capacity hint: sum existing maxStock across all products at this warehouse,
    // using the global list (VENDOR-permitted) filtered client-side — no dedicated
    // "remaining capacity" endpoint exists, this is computed here instead.
    this.pwService.getAll().subscribe({
      next: (allStock) => {
        this.allocatedAtSelectedWarehouse = allStock
          .filter((pw) => pw.warehouseId === this.selectedWarehouseId)
          .reduce((sum, pw) => sum + pw.maxStock, 0);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  launch(form: NgForm): void {
    if (!form.valid || !this.selectedWarehouseId) return;
    const v = form.value;

    this.submitting = true;
    this.errorMessage = null;

    this.pwService
      .launch({
        productId: this.productId,
        warehouseId: this.selectedWarehouseId,
        stock: v.stock,
        maxStock: v.maxStock,
        rolPercent: v.rolPercent,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: (err) => {
          // Backend's real error message (e.g. exact capacity numbers) is far more
          // useful here than a generic failure, since capacity math is involved.
          this.errorMessage = err?.error?.Message || 'Could not launch product at this warehouse.';
          this.submitting = false;
          this.cdr.detectChanges();
        },
      });
  }
}
