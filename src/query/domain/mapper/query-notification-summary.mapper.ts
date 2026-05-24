import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationSummary } from '../types/query-output.types';

export class NotificationSummaryMapper {
  static fromEntity(entity: NotificationEntity): NotificationSummary {
    return {
      notificationId: entity.notificationId,
      status: entity.status,
      channel: entity.channel,
      to: entity.to,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
