import { NotificationEntity } from '../../../common/entities/notification.entity';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';

export abstract class NotificationDbRepository {
  abstract findNotificationIdByIdempotencyKey(key: string): Promise<string | null>;
  abstract createWithOutboxEvent(
    notification: NotificationEntity,
    outboxEvent: OutboxEventEntity,
    idempotencyKey?: string,
  ): Promise<void>;
}
