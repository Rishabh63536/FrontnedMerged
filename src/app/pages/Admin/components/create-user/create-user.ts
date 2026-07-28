import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Users } from '../../services/users';
import { UserRole } from '../../../../core/models/Auth.module';
import { UserRegistrationRequest } from '../../../../core/models/User.module';
import { Warehouses } from '../../services/warehouses';
import { WarehouseResponse } from '../../models/Warehouse.module';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.html',
})
export class CreateUserComponent {
  selectedRole: UserRole = 'WAREHOUSE_MANAGER';
  availableCities: string[] = [];

  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private usersService: Users,
    private cdr: ChangeDetectorRef,
    private warehouseService: Warehouses
  ) {
    this.loadCities();
  }

  private loadCities():void{
    this.warehouseService.getAll().subscribe({
      next:(warehouses:WarehouseResponse[])=>{
        this.availableCities = [...new Set(warehouses.map(w => w.location))];
        this.cdr.detectChanges();
      },
      error:()=>{},
    })
  }

  setRole(role: UserRole): void {
    this.selectedRole = role;
    this.errorMessage = null;
  }

  create(form: NgForm): void {
    if (!form.valid) return;
    const v = form.value;

    const request: UserRegistrationRequest = {
      name: v.name,
      phone: v.phone,
      password: v.password,
      role: this.selectedRole,
    };

    if (this.selectedRole === 'VENDOR') {
      request.companyName = v.companyName;
      request.gstNumber = v.gstNumber;
      request.email = v.email;
      request.businessAddress = v.businessAddress;
      request.contactPerson = v.contactPerson;
    } else if (this.selectedRole === 'WAREHOUSE_MANAGER') {
      request.employeeCode = v.employeeCode;
      request.designation = v.designation;
    } else if (this.selectedRole === 'DRIVER') {
      request.licenseNumber = v.licenseNumber;
      request.licenseExpiry = v.licenseExpiry;
      request.location = v.location;
    }

    this.submitting = true;
    this.errorMessage = null;

    this.usersService.register(request).subscribe({
      next: () => {
        this.successMessage = `${this.selectedRole.replace('_', ' ')} created successfully.`;
        this.submitting = false;
        form.resetForm();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err) => {
        this.errorMessage =
          err?.status === 409 ? 'That phone number is already registered.' : 'Could not create account. Check all fields.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }
}
