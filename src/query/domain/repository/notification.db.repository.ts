import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

export abstract class NotificationDbRepository {
  abstract findById(notificationId: string): Promise<NotificationEntity | null>;
  abstract findByStatus(status: NotificationStatus): Promise<NotificationEntity[]>;
}
