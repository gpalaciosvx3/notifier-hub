import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { PagedResult } from '../types/query-output.types';

export abstract class NotificationDbRepository {
  abstract findById(notificationId: string): Promise<NotificationEntity | null>;
  abstract findByStatus(status: NotificationStatus): Promise<NotificationEntity[]>;
  abstract findByRecipient(to: string, pageToken?: string): Promise<PagedResult<NotificationEntity>>;
}
