import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

@Injectable()
export class NotificationDbRepositoryImpl extends NotificationDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly tableName: string,
  ) {
    super();
  }

  async updateStatus(notificationId: string, status: NotificationStatus): Promise<boolean> {
    return this.dynamo.updateIfExists(
      this.tableName,
      { notificationId },
      { status, updatedAt: new Date().toISOString() },
    );
  }
}
