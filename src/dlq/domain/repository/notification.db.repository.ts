import { NotificationStatus } from '../../../common/constants/notification-status.constants';

export abstract class NotificationDbRepository {
  abstract updateStatus(notificationId: string, status: NotificationStatus): Promise<boolean>;
}
