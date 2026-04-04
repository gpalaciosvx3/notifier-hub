import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { QueryType } from '../constants/query-type.constants';

export class SearchNotificationCommand {
  private constructor(
    public readonly type: QueryType,
    public readonly notificationId?: string,
    public readonly status?: NotificationStatus,
  ) {}

  static byId(notificationId: string): SearchNotificationCommand {
    return new SearchNotificationCommand(QueryType.BY_ID, notificationId);
  }

  static byStatus(status: NotificationStatus): SearchNotificationCommand {
    return new SearchNotificationCommand(QueryType.BY_STATUS, undefined, status);
  }
}
