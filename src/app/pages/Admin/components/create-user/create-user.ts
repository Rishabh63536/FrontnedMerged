import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Users } from '../../services/users';
import { UserRole } from '../../../../core/models/Auth.module';
import { UserRegistrationRequest } from '../../../../core/models/User.module';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.html',
})
export class CreateUserComponent {
  // Admin only ever creates these three — Customers self-register, Admins aren't
  // created through this UI (seeded/managed separately).
  selectedRole: UserRole = 'WAREHOUSE_MANAGER';

  submitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private usersService: Users,
    private cdr: ChangeDetectorRef,
  ) {}

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
      request.city = v.city;
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
