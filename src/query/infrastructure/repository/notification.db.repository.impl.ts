import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { PagedResult } from '../../domain/types/query-output.types';
import { QueryConstants } from '../../domain/constants/query.constants';

@Injectable()
export class NotificationDbRepositoryImpl extends NotificationDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly tableName: string,
  ) {
    super();
  }

  async findById(notificationId: string): Promise<NotificationEntity | null> {
    return this.dynamo.get<NotificationEntity>(this.tableName, { notificationId });
  }

  async findByStatus(status: NotificationStatus): Promise<NotificationEntity[]> {
    return this.dynamo.query<NotificationEntity>(this.tableName, {
      index: 'status-index',
      keyCondition: '#status = :status',
      attributeNames: { '#status': 'status' },
      attributeValues: { ':status': status },
    });
  }

  async findByRecipient(to: string, pageToken?: string): Promise<PagedResult<NotificationEntity>> {
    const exclusiveStartKey = pageToken
      ? (JSON.parse(Buffer.from(pageToken, 'base64').toString('utf-8')) as Record<string, unknown>)
      : undefined;
    const result = await this.dynamo.queryPaged<NotificationEntity>(this.tableName, {
      index: 'to-index',
      keyCondition: '#to = :to',
      attributeNames: { '#to': 'to' },
      attributeValues: { ':to': to },
      limit: QueryConstants.PAGE_SIZE,
      exclusiveStartKey,
      scanIndexForward: false,
    });
    const nextPageToken = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;
    return { items: result.items, nextPageToken };
  }
}
