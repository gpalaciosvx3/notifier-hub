import { z } from 'zod';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

export const WebhookEventSchema = z.object({
  notificationId: z.string().min(1),
  status: z.nativeEnum(NotificationStatus),
  callbackUrl: z.string().url(),
});

export type WebhookEventDto = z.infer<typeof WebhookEventSchema>;
