export interface WarehouseManagerResponse {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  employeeCode: string;
  designation: string;
  assignedWarehouseId: number | null;
  assignedWarehouseCode: string | null;
  assignedWarehouseLocation: string | null;
}
