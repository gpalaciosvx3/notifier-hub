import { z } from 'zod';
import { OutboxEventType } from '../../../common/constants/outbox-event-type.constants';
import { OutboxEventBrokerType } from '../../../common/constants/outbox-event-broker-type.constants';

export const OutboxEventRecordSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.nativeEnum(OutboxEventType),
  brokerType: z.nativeEnum(OutboxEventBrokerType),
  payload: z.record(z.unknown()),
  createdAt: z.string().min(1),
  ttl: z.number(),
  publishedAt: z.string().optional(),
  notificationId: z.string().min(1),
});

export type OutboxEventRecordDto = z.infer<typeof OutboxEventRecordSchema>;
