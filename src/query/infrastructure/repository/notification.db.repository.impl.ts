import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { envConfig } from '../../../common/config/env.config';

@Injectable()
export class NotificationDbRepositoryImpl extends NotificationDbRepository {
  constructor(private readonly dynamo: DynamoClient) {
    super();
  }

  async findById(notificationId: string): Promise<NotificationEntity | null> {
    return this.dynamo.get<NotificationEntity>(envConfig.notificationsTable, { notificationId });
  }

  async findByStatus(status: NotificationStatus): Promise<NotificationEntity[]> {
    return this.dynamo.query<NotificationEntity>(envConfig.notificationsTable, {
      index: 'status-index',
      keyCondition: '#status = :status',
      attributeNames: { '#status': 'status' },
      attributeValues: { ':status': status },
    });
  }
}
