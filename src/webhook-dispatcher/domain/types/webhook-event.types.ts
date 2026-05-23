import { NotificationStatus } from '../../../common/constants/notification-status.constants';

export interface WebhookEvent {
  notificationId: string;
  status: NotificationStatus;
  callbackUrl: string;
}
