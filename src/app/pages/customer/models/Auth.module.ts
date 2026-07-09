import { UserRole } from "./Enums.module";

export interface LoginRequest{
    phone: string;
    password: string; 
}
export interface LoginResponse{
    token: string;
    userId: number; 
    name: string; 
    phone: string; 
    role: UserRole; 
    roleProfileId: number; 
    roleProfileTable: string; 
    warehouseId: number | null; 
}
export interface UserResponse{
    id: number; 
    name: string; 
    phone: string; 
    role: UserRole; 
    status: string; 
}