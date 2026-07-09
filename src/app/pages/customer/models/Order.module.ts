export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface PlaceOrderRequest {
  customerId: number;
  productId: number;
  quantity: number;
  shippingAddress: string;
}

export interface OrderResponse {
  id: number;
  status: OrderStatus;
  placedAt: string;
  quantity: number;
  totalAmount: number;
  deliveryFee?: number;
  grandTotal?: number;
  orderAmountPaid?: number;
  shippingAddress: string;
  customerId: number;
  customerName: string;
  productId: number;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  vendorId: number;
  vendorCompanyName: string;
  warehouseId: number;
  warehouseCode: string;
  productWarehouseId: number;
  driverId: number | null;
  driverName: string | null;
}
