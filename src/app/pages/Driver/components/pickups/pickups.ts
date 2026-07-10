import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnRequests } from '../../services/return-requests';
import { ReturnRequestResponse } from '../../models/ReturnRequest.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-pickups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pickups.html',
})
export class PickupsComponent implements OnInit {
  returns: ReturnRequestResponse[] = [];
  loading = true;

  restockingId: number | null = null;
  selectedPhoto: { [returnId: number]: File | null } = {};
  errorMessage: { [returnId: number]: string | null } = {};
  successMessage: string | null = null;

  private driverId!: number;

  constructor(
    private loginService: Login,
    private returnRequestsService: ReturnRequests,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const driverId = this.loginService.getRoleProfileId();
    if (!driverId) {
      this.loading = false;
      return;
    }
    this.driverId = driverId;
    this.loadPickups();
  }

  private loadPickups(): void {
    this.returnRequestsService.getByDriver(this.driverId).subscribe({
      next: (returns) => {
        this.returns = returns.filter((r) => r.status === 'APPROVED');
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onPhotoSelected(returnId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedPhoto[returnId] = input.files?.[0] ?? null;
  }

  confirmRestock(returnId: number): void {
    this.restockingId = returnId;
    this.errorMessage[returnId] = null;
    const photo = this.selectedPhoto[returnId] ?? null; // optional — null is fine

    this.returnRequestsService.restock(returnId, photo).subscribe({
      next: () => {
        this.successMessage = `Return #${returnId} restocked.`;
        this.restockingId = null;
        this.loadPickups();
        this.clearSuccessSoon();
      },
      error: (err) => {
        this.errorMessage[returnId] = err?.error?.Message || 'Could not complete pickup.';
        this.restockingId = null;
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
