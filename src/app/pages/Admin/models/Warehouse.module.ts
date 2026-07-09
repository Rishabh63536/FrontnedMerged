export interface CreateWarehouseRequest {
  warehouseCode: string;
  location: string;
  capacity: number;
}

export interface UpdateWarehouseRequest {
  warehouseCode?: string;
  location?: string;
  capacity?: number;
}

export interface WarehouseAssignmentRequest {
  warehouseId: number | null; // null un-assigns
}

export interface WarehouseResponse {
  id: number;
  warehouseCode: string;
  location: string;
  capacity: number;
  managerId: number | null;
  managerName: string | null;
  managerEmployeeCode: string | null;
}
