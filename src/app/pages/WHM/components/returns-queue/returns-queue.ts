import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Warehouses } from '../../services/warehouses';
import { ReturnRequests } from '../../services/return-requests';
import { Drivers } from '../../services/drivers';
import { ReturnRequestResponse } from '../../models/ReturnRequest.module';
import { DriverResponse } from '../../models/Driver.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-returns-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returns-queue.html',
})
export class ReturnsQueueComponent implements OnInit {
  returns: ReturnRequestResponse[] = [];
  availableDrivers: DriverResponse[] = [];

  loading = true;
  actioningId: number | null = null; // which return's approve-panel is open
  selectedDriverId: { [returnId: number]: number } = {};
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private managerId!: number;

  constructor(
    private loginService: Login,
    private warehousesService: Warehouses,
    private returnRequestsService: ReturnRequests,
    private driversService: Drivers,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const managerId = this.loginService.getRoleProfileId();
    const warehouseId = this.loginService.getWarehouseId();
    if (!managerId || !warehouseId) {
      this.loading = false;
      return;
    }
    this.managerId = managerId;

    this.warehousesService.getById(warehouseId).subscribe({
      next: (wh) => {
        this.driversService.getAvailableByLocation(wh.location).subscribe({
          next: (drivers) => {
            this.availableDrivers = drivers;
            this.cdr.detectChanges();
          },
          error: () => {},
        });
      },
      error: () => {},
    });

    this.loadReturns();
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
    const driverId = this.selectedDriverId[returnId];
    if (!driverId) {
      this.errorMessage = 'Select a pickup driver first.';
      this.cdr.detectChanges();
      return;
    }

    this.returnRequestsService.approve(returnId, { managerId: this.managerId, driverId }).subscribe({
      next: () => {
        this.successMessage = `Return #${returnId} approved, pickup driver assigned.`;
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
    this.returnRequestsService.reject(returnId, { managerId: this.managerId }).subscribe({
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