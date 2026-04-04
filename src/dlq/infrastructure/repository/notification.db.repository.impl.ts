import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { envConfig } from '../../../common/config/env.config';

@Injectable()
export class NotificationDbRepositoryImpl extends NotificationDbRepository {
  constructor(private readonly dynamo: DynamoClient) {
    super();
  }

  async updateStatus(notificationId: string, status: NotificationStatus): Promise<void> {
    await this.dynamo.updateFields(
      envConfig.notificationsTable,
      { notificationId },
      { status, updatedAt: new Date().toISOString() },
    );
  }
}
