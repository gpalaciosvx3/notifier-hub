import { DlqMessageType } from '../constants/dlq-message-type.constants';

export type NotificationFailedMessage = {
  messageType: DlqMessageType.NOTIFICATION_FAILED;
  notificationId: string;
  callbackUrl: string;
};

export type WebhookFailedMessage = {
  messageType: DlqMessageType.WEBHOOK_FAILED;
  notificationId: string;
};

export type DlqMessage = NotificationFailedMessage | WebhookFailedMessage;
