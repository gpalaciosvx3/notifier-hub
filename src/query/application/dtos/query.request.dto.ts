import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { QueryType } from '../../domain/constants/query-type.constants';

export type QueryRequestDto =
  | { tipo: QueryType.BY_ID; notificationId: string }
  | { tipo: QueryType.BY_STATUS; status: NotificationStatus };
