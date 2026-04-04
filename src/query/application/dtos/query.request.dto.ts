import { z } from 'zod';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { QueryType } from '../../domain/constants/query-type.constants';

export const QueryRawSchema = z.object({
  id: z.string().min(1).optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
}).refine(data => data.id ?? data.status, { message: 'Either id or status is required' });

export type QueryRequestDto =
  | { tipo: QueryType.BY_ID; notificationId: string }
  | { tipo: QueryType.BY_STATUS; status: NotificationStatus };
