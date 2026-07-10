export type NotificationType = 'ROL_BREACH' | 'ORDER_ASSIGNED' | 'ORDER_STATUS_CHANGED';

export interface NotificationResponse {
  id: number;
  recipientUserId: number;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
  relatedEntityId: number | null;
  relatedEntityType: string | null;
}
