import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { QueryType } from '../constants/query-type.constants';
import { SearchQueryInput } from '../types/query-search-input.types';

export class SearchQueryMapper {
  static byId(notificationId: string): SearchQueryInput {
    return { type: QueryType.BY_ID, notificationId };
  }

  static byStatus(status: NotificationStatus): SearchQueryInput {
    return { type: QueryType.BY_STATUS, status };
  }

  static fromDto(dto: { id?: string; status?: NotificationStatus }): SearchQueryInput {
    return dto.id ? SearchQueryMapper.byId(dto.id) : SearchQueryMapper.byStatus(dto.status!);
  }
}
