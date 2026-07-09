import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UserRegistrationRequest } from '../../models/Registration.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  submitting = false;
  errorMessage: string | null = null;

  constructor(
    private authService: Login,
    private router: Router,
  ) {}

  register(form: NgForm): void {
    if (!form.valid) return;

    const v = form.value;

    if (v.password !== v.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    // Role is always CUSTOMER — this is the customer-only app, the person
    // never picks a role themselves.
    const request: UserRegistrationRequest = {
      name: v.name,
      phone: v.phone,
      password: v.password,
      role: 'CUSTOMER',
      companyName: v.companyName,
      gstNumber: v.gstNumber,
      email: v.email,
      shippingAddress: v.shippingAddress,
      billingAddress: v.billingAddress,
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err:any) => {
        this.errorMessage =
          err?.status === 409 || err?.status === 400
            ? 'That phone number is already registered, or a field is invalid.'
            : 'Registration failed. Please try again.';
        this.submitting = false;
      },
    });
  }
}
