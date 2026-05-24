import { NotificationEntity } from '../../../common/entities/notification.entity';

export abstract class NotificationSendStrategy {
  abstract send(notification: NotificationEntity): Promise<void>;
}
