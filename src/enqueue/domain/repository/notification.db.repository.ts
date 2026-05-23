import { NotificationEntity } from '../../../common/entities/notification.entity';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';

export abstract class NotificationDbRepository {
  abstract createWithOutboxEvent(notification: NotificationEntity, outboxEvent: OutboxEventEntity): Promise<void>;
}
