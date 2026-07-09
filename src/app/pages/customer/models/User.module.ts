import { UserRole, UserStatus } from "./Enums.module";

export interface User{
    id:number;
    name:string;
    phone:number;
    role:UserRole;
    status:UserStatus;
}