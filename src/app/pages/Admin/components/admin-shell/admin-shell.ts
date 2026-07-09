import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Login } from '../../../../core/services/login';

// This wraps every Admin page in your sidebar. Because this route has BOTH
// a component AND children (see app.routes.ts), Angular renders THIS
// component at /admin, and this component's own <router-outlet> is where
// Dashboard/Orders/etc. actually render — nested inside your sidebar layout,
// completely separate from the shared root app.html's outlet.
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
})
export class AdminShellComponent {
  constructor(
    private loginService: Login,
    private router: Router,
  ) {}

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}