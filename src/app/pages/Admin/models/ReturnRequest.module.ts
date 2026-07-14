export type ReturnReason = 'DAMAGED' | 'WRONG_ITEM' | 'NOT_NEEDED' | 'OTHER';
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RESTOCKED';

export interface ApproveReturnRequest {
  managerId: number;
  driverId: number;
}
export interface RejectReturnRequest {
  managerId: number;
  notes?: string;
}
export interface ReturnRequestResponse {
  id: number;
  orderId: number;
  customerId: number;
  returnQuantity:number;
  reason: ReturnReason;
  notes: string | null;
  photoUrl: string | null;
  status: ReturnStatus;
  requestedAt: string;
  resolvedAt: string | null;
  resolvedByManagerId: number | null;
  pickupDriverId: number | null;
  restockedAt: string | null;
  refundAmount:number;
  handlingFeeAmount:number;
}
