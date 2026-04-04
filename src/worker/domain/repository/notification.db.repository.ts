import { NotificationStatus } from '../../../common/constants/notification-status.constants';

export abstract class NotificationDbRepository {
  abstract updateStatus(notificationId: string, status: NotificationStatus, motivoFallo?: string): Promise<void>;
  abstract updateStatusConditional(
    notificationId: string,
    nuevoStatus: NotificationStatus,
    condicionStatus: NotificationStatus,
  ): Promise<boolean>;
}
