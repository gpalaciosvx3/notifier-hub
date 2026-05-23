import { NotificationStatus } from '../../../common/constants/notification-status.constants';

export type NotificationScheduledPayload = {
  notification: Record<string, unknown>;
  scheduledAt: string;
};

export type WebhookRequestedPayload = {
  notificationId: string;
  status: NotificationStatus;
  callbackUrl: string;
};
