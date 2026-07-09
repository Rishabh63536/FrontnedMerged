import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReturnRequests } from '../../services/return-requests';
import { WarehouseManagers } from '../../services/warehouse-managers';
import { Drivers } from '../../services/drivers';
import { ReturnRequestResponse } from '../../models/ReturnRequest.module';
import { WarehouseManagerResponse } from '../../models/WarehouseManager.module';
import { DriverResponse } from '../../models/Driver.module';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returns.html',
})
export class ReturnsComponent implements OnInit {
  returns: ReturnRequestResponse[] = [];
  managers: WarehouseManagerResponse[] = [];
  availableDrivers: DriverResponse[] = [];
  loading = true;

  actioningId: number | null = null;
  selectedManagerId: { [returnId: number]: number } = {};
  selectedDriverId: { [returnId: number]: number } = {};
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private returnRequestsService: ReturnRequests,
    private managersService: WarehouseManagers,
    private driversService: Drivers,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadReturns();
    this.managersService.getAll().subscribe({
      next: (m) => {
        this.managers = m;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
    this.driversService.getAllAvailable().subscribe({
      next: (d) => {
        this.availableDrivers = d;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  private loadReturns(): void {
    this.returnRequestsService.getPending().subscribe({
      next: (returns) => {
        this.returns = returns;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openApprove(returnId: number): void {
    this.actioningId = this.actioningId === returnId ? null : returnId;
    this.errorMessage = null;
  }

  confirmApprove(returnId: number): void {
    const managerId = this.selectedManagerId[returnId];
    const driverId = this.selectedDriverId[returnId];
    if (!managerId || !driverId) {
      this.errorMessage = 'Select both an attributed manager and a pickup driver.';
      this.cdr.detectChanges();
      return;
    }

    this.returnRequestsService.approve(returnId, { managerId, driverId }).subscribe({
      next: () => {
        this.successMessage = `Return #${returnId} approved.`;
        this.actioningId = null;
        this.loadReturns();
        this.availableDrivers = this.availableDrivers.filter((d) => d.id !== driverId);
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: () => {
        this.errorMessage = 'Could not approve — driver may no longer be available.';
        this.cdr.detectChanges();
      },
    });
  }

  reject(returnId: number): void {
    const managerId = this.selectedManagerId[returnId] ?? this.managers[0]?.id;
    if (!managerId) {
      this.errorMessage = 'No warehouse manager exists to attribute this rejection to.';
      this.cdr.detectChanges();
      return;
    }
    this.returnRequestsService.reject(returnId, { managerId }).subscribe({
      next: () => {
        this.successMessage = `Return #${returnId} rejected.`;
        this.loadReturns();
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: () => {
        this.errorMessage = 'Could not reject this return.';
        this.cdr.detectChanges();
      },
    });
  }
}
