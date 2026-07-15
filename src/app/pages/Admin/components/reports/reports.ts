import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Reports as ReportsService } from '../../services/reports';
import { WarehouseCollectionRecordResponse, WarehouseSummary } from '../../models/Warehousecollectionrecord.module';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './reports.html',
})
export class ReportsComponent implements OnInit {
  allRecords: WarehouseCollectionRecordResponse[] = [];
  loading = true;

  fromDate: string = '';
  toDate: string = '';
  expandedWarehouseId: number | null = null;

  // Clean, modern configuration for the Bar Chart
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 10 } 
      } 
    },
    scales: { 
      x: {
        grid: { display: false } // Hides harsh vertical lines
      },
      y: { 
        beginAtZero: true,
        grid: { color: '#f1f3f5' }
      } 
    },
  };

  // Modern configuration for the Pie Chart
  chartOptionsPie: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, boxWidth: 10 }
      }
    }
  };

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.reportsService.getWarehouseCollections().subscribe({
      next: (records) => {
        this.allRecords = records;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onFilterChange(): void {
    this.cdr.detectChanges();
  }

  get filteredRecords(): WarehouseCollectionRecordResponse[] {
    return this.allRecords.filter((r) => {
      const paidDate = new Date(r.paidAt);
      if (this.fromDate && paidDate < new Date(this.fromDate)) return false;
      if (this.toDate && paidDate > new Date(this.toDate + 'T23:59:59')) return false;
      return true;
    });
  }

  get warehouseSummaries(): WarehouseSummary[] {
    const map = new Map<number, WarehouseSummary>();

    for (const r of this.filteredRecords) {
      if (!map.has(r.warehouseId)) {
        map.set(r.warehouseId, {
          warehouseId: r.warehouseId,
          warehouseCode: r.warehouseCode,
          gross: 0,
          refunded: 0,
          net: 0,
          transactionCount: 0,
        });
      }
      const summary = map.get(r.warehouseId)!;

      if (r.paymentType === 'REFUND') {
        summary.refunded += Math.abs(r.amount);
      } else {
        summary.gross += r.amount;
      }
      summary.net += r.amount;
      summary.transactionCount++;
    }

    return Array.from(map.values()).sort((a, b) => b.net - a.net);
  }

  toggleExpand(warehouseId: number): void {
    this.expandedWarehouseId = this.expandedWarehouseId === warehouseId ? null : warehouseId;
  }

  getRecordsForWarehouse(warehouseId: number): WarehouseCollectionRecordResponse[] {
    return this.filteredRecords
      .filter((r) => r.warehouseId === warehouseId)
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }

  // Bar Chart Data Definition (with fixed bar widths & rounded corners)
  get chartData(): ChartData<'bar'> {
    const summaries = this.warehouseSummaries;
    return {
      labels: summaries.map((s) => s.warehouseCode),
      datasets: [
        { 
          label: 'Gross', 
          data: summaries.map((s) => s.gross), 
          backgroundColor: '#16324F',
          maxBarThickness: 28, // Fixes excessive thickness
          borderRadius: 6      // Modern rounded appearance
        },
        { 
          label: 'Net', 
          data: summaries.map((s) => s.net), 
          backgroundColor: '#0E7C86',
          maxBarThickness: 28, // Fixes excessive thickness
          borderRadius: 6      // Modern rounded appearance
        },
      ],
    };
  }


  getWarehouseStats(warehouseId: number): { refundRatePercent: number; avgNetPerOrder: number; distinctOrderCount: number } {
  const records = this.getRecordsForWarehouse(warehouseId);
 
  const gross = records
    .filter((r) => r.paymentType !== 'REFUND')
    .reduce((sum, r) => sum + r.amount, 0);
 
  const refunded = records
    .filter((r) => r.paymentType === 'REFUND')
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
 
  const net = records.reduce((sum, r) => sum + r.amount, 0);
 
  // Distinct orders, not raw transaction rows — one order can produce 2-3
  // payment rows (advance/final/refund), so dividing by record count would
  // understate the true average order value.
  const distinctOrderCount = new Set(records.map((r) => r.orderId)).size;
 
  return {
    refundRatePercent: gross > 0 ? this.round2((refunded / gross) * 100) : 0,
    avgNetPerOrder: distinctOrderCount > 0 ? this.round2(net / distinctOrderCount) : 0,
    distinctOrderCount,
  };
}
 
private round2(value: number): number {
  return Math.round(value * 100) / 100;
}

  // Pie Chart Data Definition (Dynamic breakdown of net metrics)
  get pieChartData(): ChartData<'pie'> {
    const summaries = this.warehouseSummaries;
    // Premium dashboard color palette
    const colors = ['#0E7C86', '#16324F', '#3A86FF', '#FF006E', '#FFBE0B', '#8338EC'];
    
    return {
      labels: summaries.map((s) => s.warehouseCode),
      datasets: [
        {
          data: summaries.map((s) => Math.max(0, s.net)), // Avoid negative slices breaking UI
          backgroundColor: colors.slice(0, summaries.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };
  }


  chartOptionsLine: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: false, grid: { color: '#f1f3f5' } },
  },
};
 
chartOptionsDonut: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
  cutout: '65%',
};
 
// NEW — per-warehouse cumulative net-collection trend, bucketed by day.
// Cumulative (running total) rather than daily deltas, since with a small
// test dataset daily amounts bounce around too much to read as a "trend" —
// a running total is monotonic-ish and actually shows direction of travel.
getWarehouseTrendData(warehouseId: number): ChartData<'line'> {
  const records = this.getRecordsForWarehouse(warehouseId)
    .slice()
    .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime());
 
  const byDate = new Map<string, number>();
  for (const r of records) {
    const dateKey = new Date(r.paidAt).toISOString().split('T')[0]; // YYYY-MM-DD
    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + r.amount);
  }
 
  const sortedDates = Array.from(byDate.keys()).sort();
  let cumulative = 0;
  const cumulativeData = sortedDates.map((d) => {
    cumulative += byDate.get(d)!;
    return this.round2(cumulative);
  });
 
  return {
    labels: sortedDates,
    datasets: [
      {
        label: 'Cumulative Net Collection',
        data: cumulativeData,
        borderColor: '#0E7C86',
        backgroundColor: 'rgba(14, 124, 134, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };
}
 
// NEW — Kept vs Refunded, visually, per warehouse.
getWarehouseRefundDonutData(warehouseId: number): ChartData<'doughnut'> {
  const records = this.getRecordsForWarehouse(warehouseId);
  const gross = records.filter((r) => r.paymentType !== 'REFUND').reduce((sum, r) => sum + r.amount, 0);
  const refunded = records.filter((r) => r.paymentType === 'REFUND').reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const kept = Math.max(0, gross - refunded);
 
  return {
    labels: ['Kept', 'Refunded'],
    datasets: [
      {
        data: [kept, refunded],
        backgroundColor: ['#16324F', '#B3261E'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };
}
}