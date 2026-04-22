import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

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
}
