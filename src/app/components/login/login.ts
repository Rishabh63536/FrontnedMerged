import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Login } from '../../core/services/login';
import { ROLE_HOME_ROUTE } from '../../core/models/Auth.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {
  submitting = false;
  loginError: string | null = null;

  constructor(
    private loginService: Login,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  login(form: NgForm): void {
    if (!form.valid) return;

    this.submitting = true;
    this.loginError = null;
    const v = form.value;

    this.loginService.login(v.phone, v.password).subscribe({
      next: (result) => {
        localStorage.setItem('result', JSON.stringify(result));

        // The one real behavioral difference from the 4 separate apps: no role
        // rejection here — EVERY role logs in through this same screen, then
        // gets routed to their own home route.
        if (result.role === 'WAREHOUSE_MANAGER' && !result.warehouseId) {
          this.loginError = 'Your account is not yet assigned to a warehouse. Contact your admin.';
          this.loginService.logout();
          this.submitting = false;
          this.cdr.detectChanges();
          return;
        }

        this.router.navigate([ROLE_HOME_ROUTE[result.role]]);
      },
      error: (err) => {
        this.loginError =
          err?.status === 401 ? 'Incorrect phone number or password.' : 'Login failed. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }
}
