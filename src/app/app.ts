import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Login } from './core/services/login';
import { ROLE_HOME_ROUTE } from './core/models/Auth.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(
    private loginService: Login,
    private router: Router,
  ) {}

  get isLoggedIn(): boolean {
    return this.loginService.isLoggedIn();
  }

  get homeRoute(): string {
    const user = this.loginService.getStoredUser();
    return user ? ROLE_HOME_ROUTE[user.role] : '/login';
  }

  get UserRole(): string|null{
    return this.loginService.getStoredUser()?.role?? null;
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}