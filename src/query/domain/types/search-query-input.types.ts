import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { QueryType } from '../constants/query-type.constants';

export interface RawSearchQuery {
  id?: string;
  status?: NotificationStatus;
}

export interface SearchQueryInput {
  type: QueryType;
  notificationId?: string;
  status?: NotificationStatus;
}
