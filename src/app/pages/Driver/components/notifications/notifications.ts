import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notifications as NotificationsService } from '../../services/notifications';
import { NotificationResponse } from '../../models/Notification.module';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationResponse[] = [];
  loading = true;

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
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  markAsRead(notification: NotificationResponse): void {
    if (notification.read) return;
    this.notificationsService.markAsRead(notification.id).subscribe({
      next: (updated) => {
        notification.read = updated.read;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }
}
