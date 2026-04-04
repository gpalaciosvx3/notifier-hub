import { NotificationEntity } from '../../../common/entities/notification.entity';

export abstract class NotificationSqsRepository {
  abstract enqueue(notificacion: NotificationEntity): Promise<void>;
}
