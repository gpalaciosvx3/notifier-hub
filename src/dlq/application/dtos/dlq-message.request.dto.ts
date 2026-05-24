import { z } from 'zod';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';

export const NotificationFailedMessageSchema = z.object({
  notificationId: z.string().min(1),
  channel: z.nativeEnum(NotificationChannel),
  callbackUrl: z.string(),
});

export const WebhookFailedMessageSchema = z.object({
  notificationId: z.string().min(1),
  sentAt: z.string().min(1),
});
