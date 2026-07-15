export type PaymentType = 'ADVANCE' | 'FINAL' | 'REFUND';

export interface WarehouseCollectionRecordResponse {
  warehouseId: number;
  warehouseCode: string;
  orderId: number;
  paymentType: PaymentType;
  amount: number; // positive for ADVANCE/FINAL, negative for REFUND
  paidAt: string;
}

// Client-side computed shape ,not returned by the backend, built by grouping the flat record list above.
export interface WarehouseSummary {
  warehouseId: number;
  warehouseCode: string;
  gross: number;
  refunded: number;
  net: number;
  transactionCount: number;
}