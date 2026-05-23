import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';

export abstract class NotificationDbRepository {
  abstract updateStatus(notificationId: string, status: NotificationStatus, motivoFallo?: string): Promise<void>;
  abstract updateStatusConditional(
    notificationId: string,
    nuevoStatus: NotificationStatus,
    condicionStatus: NotificationStatus,
  ): Promise<boolean>;
  abstract updateStatusWithOutboxEvent(
    notificationId: string,
    status: NotificationStatus,
    outboxEvent: OutboxEventEntity,
  ): Promise<void>;
}
