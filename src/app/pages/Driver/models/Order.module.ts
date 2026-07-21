export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';

export interface OrderResponse {
  id: number;
  status: OrderStatus;
  placedAt: string;
  quantity: number;
  totalAmount: number;
  shippingAddress: string;
  customerId: number;
  amountPaid?: number;
  customerName: string;
  customerPhone?: string;
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
