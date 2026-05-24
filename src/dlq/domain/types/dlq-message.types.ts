import { NotificationChannel } from '../../../common/constants/notification-channel.constants';

export type NotificationFailedMessage = {
  notificationId: string;
  channel: NotificationChannel;
  callbackUrl: string;
};

export type WebhookFailedMessage = {
  notificationId: string;
  sentAt: string;
};
