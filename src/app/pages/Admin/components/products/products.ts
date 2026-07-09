import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Orders } from '../../services/orders';
import { ReturnRequests } from '../../services/return-requests';
import { Warehouses } from '../../services/warehouses';
import { WarehouseManagers } from '../../services/warehouse-managers';
import { ProductsService } from '../../services/product';
import { ProductResponse } from '../../models/Product.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './products.html',
})
export class ProductsComponent implements OnInit {
  products: ProductResponse[] = [];
  warehousesList: { id: number; code: string; location: string }[] = [];
  selectedWarehouseId: number | 'all' = 'all';

  adminName: string = 'Administrator';
  totalOrders: number = 0;
  pendingReturnsCount: number = 0;
  unassignedWarehousesCount: number = 0;
  unassignedManagersCount: number = 0;

  constructor(
    private productsService: ProductsService,
    private loginService: Login,
    private ordersService: Orders,
    private returnRequestsService: ReturnRequests,
    private warehousesService: Warehouses,
    private warehouseManagersService: WarehouseManagers,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadProductInventory();
  }

  get filteredProducts(): ProductResponse[] {
    if (this.selectedWarehouseId === 'all') {
      return this.products;
    }
    return this.products.filter(prod => prod.warehouseId === this.selectedWarehouseId);
  }

  onWarehouseChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedWarehouseId = value === 'all' ? 'all' : Number(value);
  }

  private loadProductInventory(): void {
    this.productsService.getProducts().subscribe({
      next: (data: ProductResponse[]) => {
        this.products = data;
        this.extractUniqueWarehouses(data);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to parse product array data', error);
      }
    });
  }

  private extractUniqueWarehouses(data: ProductResponse[]): void {
    const uniqueMap = new Map<number, { id: number; code: string; location: string }>();

    data.forEach(item => {
      if (item.warehouseId && !uniqueMap.has(item.warehouseId)) {
        uniqueMap.set(item.warehouseId, {
          id: item.warehouseId,
          code: item.warehouseCode,
          location: item.warehouseLocation
        });
      }
    });

    this.warehousesList = Array.from(uniqueMap.values());
  }
}