import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Warehouses as WarehousesService } from '../../services/warehouses';
import { WarehouseManagers } from '../../services/warehouse-managers';
import { WarehouseResponse } from '../../models/Warehouse.module';
import { WarehouseManagerResponse } from '../../models/WarehouseManager.module';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warehouses.html',
})
export class WarehousesComponent implements OnInit {
  warehouses: WarehouseResponse[] = [];
  managers: WarehouseManagerResponse[] = [];
  loading = true;

  showCreateForm = false;
  editingWarehouseId: number | null = null;
  assigningWarehouseId: number | null = null;
  selectedManagerId: { [warehouseId: number]: number } = {};

  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private warehousesService: WarehousesService,
    private managersService: WarehouseManagers,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.warehousesService.getAll().subscribe({
      next: (w) => {
        this.warehouses = w;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    this.managersService.getAll().subscribe({
      next: (m) => {
        this.managers = m;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  get unassignedManagers(): WarehouseManagerResponse[] {
    return this.managers.filter((m) => m.assignedWarehouseId === null);
  }

  // ── Create ──────────────────────────────────────────────
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.errorMessage = null;
  }

  createWarehouse(form: NgForm): void {
    if (!form.valid) return;
    const v = form.value;
    this.warehousesService.create({ warehouseCode: v.warehouseCode, location: v.location, capacity: v.capacity }).subscribe({
      next: () => {
        this.successMessage = 'Warehouse created.';
        this.showCreateForm = false;
        form.resetForm();
        this.loadAll();
        this.clearSuccessSoon();
      },
      error: () => {
        this.errorMessage = 'Could not create warehouse — code may already be in use.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Edit ────────────────────────────────────────────────
  toggleEdit(id: number): void {
    this.editingWarehouseId = this.editingWarehouseId === id ? null : id;
    this.errorMessage = null;
  }

  saveEdit(id: number, form: NgForm): void {
    if (!form.valid) return;
    const v = form.value;
    this.warehousesService.update(id, { warehouseCode: v.warehouseCode, location: v.location, capacity: v.capacity }).subscribe({
      next: () => {
        this.successMessage = 'Warehouse updated.';
        this.editingWarehouseId = null;
        this.loadAll();
        this.clearSuccessSoon();
      },
      error: () => {
        this.errorMessage = 'Could not update warehouse.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Delete ──────────────────────────────────────────────
  deleteWarehouse(id: number, code: string): void {
    if (!confirm(`Delete warehouse ${code}? This cannot be undone.`)) return;
    this.warehousesService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Warehouse deleted.';
        this.loadAll();
        this.clearSuccessSoon();
      },
      error: () => {
        this.errorMessage = 'Could not delete — it may still have active products or orders.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Assign / Unassign manager ────────────────────────────
  toggleAssign(warehouseId: number): void {
    this.assigningWarehouseId = this.assigningWarehouseId === warehouseId ? null : warehouseId;
    this.errorMessage = null;
  }

  confirmAssign(warehouseId: number): void {
    const managerId = this.selectedManagerId[warehouseId];
    if (!managerId) {
      this.errorMessage = 'Select a manager first.';
      this.cdr.detectChanges();
      return;
    }
    this.managersService.assignWarehouse(managerId, { warehouseId }).subscribe({
      next: () => {
        this.successMessage = 'Manager assigned.';
        this.assigningWarehouseId = null;
        this.loadAll();
        this.clearSuccessSoon();
      },
      error: () => {
        this.errorMessage = 'Could not assign — that warehouse may already have a manager.';
        this.cdr.detectChanges();
      },
    });
  }

  unassignManager(managerId: number): void {
    if (!confirm('Unassign this manager from their warehouse?')) return;
    this.managersService.assignWarehouse(managerId, { warehouseId: null }).subscribe({
      next: () => {
        this.successMessage = 'Manager unassigned.';
        this.loadAll();
        this.clearSuccessSoon();
      },
      error: () => {
        this.errorMessage = 'Could not unassign manager.';
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
