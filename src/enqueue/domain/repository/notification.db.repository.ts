import { NotificationEntity } from '../../../common/entities/notification.entity';

export abstract class NotificationDbRepository {
  abstract create(notificacion: NotificationEntity): Promise<void>;
}
