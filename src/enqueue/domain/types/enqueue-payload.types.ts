import { NotificationEntity } from '../../../common/entities/notification.entity';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';

export type EnqueuePayload = { notification: NotificationEntity; outboxEvent: OutboxEventEntity };
