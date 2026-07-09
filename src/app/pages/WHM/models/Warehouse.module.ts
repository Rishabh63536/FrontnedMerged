export interface WarehouseResponse {
  id: number;
  warehouseCode: string;
  location: string;
  capacity: number;
  managerId: number | null;
  managerName: string | null;
  managerEmployeeCode: string | null;
}
