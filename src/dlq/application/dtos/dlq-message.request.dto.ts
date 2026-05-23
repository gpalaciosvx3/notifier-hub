import { z } from 'zod';
import { DlqMessageType } from '../../domain/constants/dlq-message-type.constants';

export const NotificationFailedMessageSchema = z.object({
  messageType: z.literal(DlqMessageType.NOTIFICATION_FAILED),
  notificationId: z.string().min(1),
  callbackUrl: z.string().min(1),
});

export const WebhookFailedMessageSchema = z.object({
  messageType: z.literal(DlqMessageType.WEBHOOK_FAILED),
  notificationId: z.string().min(1),
});

export const DlqMessageSchema = z.discriminatedUnion('messageType', [
  NotificationFailedMessageSchema,
  WebhookFailedMessageSchema,
]);

export type NotificationFailedMessage = z.infer<typeof NotificationFailedMessageSchema>;
export type WebhookFailedMessage = z.infer<typeof WebhookFailedMessageSchema>;
export type DlqMessage = z.infer<typeof DlqMessageSchema>;
