import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Users } from '../../services/users';
import { UserResponse, UserStatus } from '../../../../core/models/User.module';
import { UserRole } from '../../../../core/models/Auth.module';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-users.html',
})
export class ManageUsersComponent implements OnInit {
  users: UserResponse[] = [];
  loading = true;
  filterRole: UserRole | 'ALL' = 'ALL';
  searchQuery = '';

  editingUserId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private usersService: Users,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredUsers(): UserResponse[] {
    return this.users.filter((user) => {
      const matchesRole = this.filterRole === 'ALL' || user.role === this.filterRole;

      const cleanQuery = this.searchQuery.trim().toLowerCase();
      const matchesSearch = !cleanQuery ||
        user.name.toLowerCase().includes(cleanQuery) ||
        user.phone.toLowerCase().includes(cleanQuery);

      return matchesRole && matchesSearch;
    });
  }

  toggleEdit(id: number): void {
    this.editingUserId = this.editingUserId === id ? null : id;
    this.errorMessage = null;
  }

  saveEdit(id: number, form: NgForm): void {
    if (!form.valid) return;
    const v = form.value;
    const payload: { name?: string; phone?: string; password?: string } = {
      name: v.name,
      phone: v.phone,
    };
    if (v.password) payload.password = v.password;

    this.usersService.update(id, payload).subscribe({
      next: () => {
        this.successMessage = 'User updated.';
        this.editingUserId = null;
        this.loadUsers();
        this.clearSuccessSoon();
      },
      error: (err) => {
        this.errorMessage = err?.status === 409 ? 'That phone number is already in use.' : 'Could not update user.';
        this.cdr.detectChanges();
      },
    });
  }

  toggleStatus(user: UserResponse): void {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.usersService.updateStatus(user.id, newStatus).subscribe({
      next: () => {
        this.successMessage = `${user.name} is now ${newStatus}.`;
        this.loadUsers();
        this.clearSuccessSoon();
      },
      error: () => {
        this.errorMessage = 'Could not update status.';
        this.cdr.detectChanges();
      },
    });
  }

  deleteUser(user: UserResponse): void {
    if (!confirm(`Delete ${user.name} (${user.role})? This cannot be undone.`)) return;
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.successMessage = `${user.name} deleted.`;
        this.loadUsers();
        this.clearSuccessSoon();
      },
      error: () => {
        this.errorMessage = 'Could not delete this user — they may have active orders/assignments.';
        this.cdr.detectChanges();
      },
    });
  }

  private clearSuccessSoon(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 4000);
  }
}