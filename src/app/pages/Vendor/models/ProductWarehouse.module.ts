export interface LaunchProductAtWarehouseRequest {
  productId: number;
  warehouseId: number;
  stock: number;
  maxStock: number;
  rolPercent: number;
}

export interface RestockRequest {
  amount: number;
}

export interface ProductWarehouseResponse {
  id: number;
  productId: number;
  productName: string;
  productPrice: number;
  vendorId: number;
  vendorCompanyName: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseLocation: string;
  stock: number;
  maxStock: number;
  rolPercent: number;
  currentStockPercent: number;
  belowRol: boolean;
}
