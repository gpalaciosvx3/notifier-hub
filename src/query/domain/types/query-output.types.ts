import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

export interface NotificationSummary {
  notificationId: string;
  status: NotificationStatus;
  channel: NotificationChannel;
  to: string;
  webhookStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  nextPageToken?: string;
}
