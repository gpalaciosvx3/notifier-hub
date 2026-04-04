import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

export interface NotificationResponseDto extends NotificationEntity {}

export interface NotificationListResponseDto {
  notificaciones: NotificationEntity[];
  total: number;
}

export { NotificationStatus };
