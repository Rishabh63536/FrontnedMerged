import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notifications as NotificationsService } from '../../services/notifications';
import { NotificationResponse } from '../../models/Notification.module';
import { Login } from '../../../../core/services/login';

type ReadFilter = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.html',
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationResponse[] = [];
  loading = true;

  // ── Filters ──
  readFilter: ReadFilter = 'all';
  fromDate = ''; // yyyy-MM-dd from <input type="date">
  toDate = '';
  filtered: NotificationResponse[] = [];

  markingAll = false;

  constructor(
    private loginService: Login,
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const userId = this.loginService.getUserId();
    if (!userId) {
      this.loading = false;
      return;
    }

    this.notificationsService.getForUser(userId).subscribe({
      next: (list) => {
        this.notifications = list;
        this.loading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /** Read/unread + date-range filtering, newest first. */
  applyFilters(): void {
    let list = this.notifications;

    if (this.readFilter === 'unread') list = list.filter((n) => !n.read);
    if (this.readFilter === 'read') list = list.filter((n) => n.read);

    if (this.fromDate) {
      const from = new Date(this.fromDate);
      from.setHours(0, 0, 0, 0);
      list = list.filter((n) => new Date(n.createdAt) >= from);
    }
    if (this.toDate) {
      const to = new Date(this.toDate);
      to.setHours(23, 59, 59, 999); // include the whole "to" day
      list = list.filter((n) => new Date(n.createdAt) <= to);
    }

    this.filtered = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  setReadFilter(f: ReadFilter): void {
    this.readFilter = f;
    this.applyFilters();
  }

  clearDates(): void {
    this.fromDate = '';
    this.toDate = '';
    this.applyFilters();
  }

  unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  markAsRead(notification: NotificationResponse): void {
    if (notification.read) return;
    this.notificationsService.markAsRead(notification.id).subscribe({
      next: (updated) => {
        notification.read = updated.read;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  /** Fires one markAsRead per unread notification; refreshes list as each completes. */
  markAllAsRead(): void {
    const unread = this.notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    this.markingAll = true;

    let remaining = unread.length;
    for (const n of unread) {
      this.notificationsService.markAsRead(n.id).subscribe({
        next: (updated) => {
          n.read = updated.read;
          remaining--;
          if (remaining === 0) {
            this.markingAll = false;
            this.applyFilters();
          }
          this.cdr.detectChanges();
        },
        error: () => {
          remaining--;
          if (remaining === 0) this.markingAll = false;
          this.cdr.detectChanges();
        },
      });
    }
  }
}