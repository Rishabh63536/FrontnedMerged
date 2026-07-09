export type PaymentType = 'ADVANCE' | 'FINAL';
export type PaymentStatus = 'SUCCESS' | 'FAILED';

export interface PaymentResponse {
  id: number;
  orderId: number;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  method: string;
  paidAt: string;
  orderAmountPaid: number;
  orderTotalAmount: number;
}
