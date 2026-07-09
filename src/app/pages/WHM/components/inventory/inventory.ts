import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductWarehouses } from '../../services/product-warehouses';
import { ProductWarehouseResponse } from '../../models/ProductWarehouse.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.html',
})
export class InventoryComponent implements OnInit {
  items: ProductWarehouseResponse[] = [];
  loading = true;

  restockingId: number | null = null;
  restockAmount: { [id: number]: number } = {};
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private warehouseId!: number;

  constructor(
    private loginService: Login,
    private pwService: ProductWarehouses,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const warehouseId = this.loginService.getWarehouseId();
    if (!warehouseId) {
      this.loading = false;
      return;
    }
    this.warehouseId = warehouseId;
    this.loadStock();
  }

  private loadStock(): void {
    this.pwService.getByWarehouseId(this.warehouseId).subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Calculated strictly in TypeScript to avoid any HTML visibility/scope issues
  getStockPercentage(item: ProductWarehouseResponse): number {
    if (!item.maxStock || item.maxStock <= 0) {
      return 0;
    }
    return Math.round((item.stock / item.maxStock) * 100);
  }

  openRestock(item: ProductWarehouseResponse): void {
    if (this.restockingId === item.id) {
      this.restockingId = null;
    } else {
      this.restockingId = item.id;
      this.restockAmount[item.id] = item.stock;
    }
    this.errorMessage = null;
  }

  confirmRestock(id: number): void {
    const amount = this.restockAmount[id];
    if (amount === undefined || amount === null || amount < 0) {
      this.errorMessage = 'Enter a valid stock amount.';
      this.cdr.detectChanges();
      return;
    }

    this.pwService.restock(id, { amount }).subscribe({
      next: () => {
        this.successMessage = 'Stock updated.';
        this.restockingId = null;
        this.loadStock();
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err) => {
        this.errorMessage =
          err?.status === 400 ? 'That would exceed max stock capacity.' : 'Could not restock.';
        this.cdr.detectChanges();
      },
    });
  }
}