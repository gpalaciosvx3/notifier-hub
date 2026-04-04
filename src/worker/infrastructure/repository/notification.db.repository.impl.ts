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

  async updateStatus(
    notificationId: string,
    status: NotificationStatus,
    failureReason?: string,
  ): Promise<void> {
    const fields: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
      ...(failureReason !== undefined && { failureReason }),
    };
    await this.dynamo.updateFields(envConfig.notificationsTable, { notificationId }, fields);
  }

  async updateStatusConditional(
    notificationId: string,
    newStatus: NotificationStatus,
    conditionStatus: NotificationStatus,
  ): Promise<boolean> {
    return this.dynamo.updateFieldsWithCondition(
      envConfig.notificationsTable,
      { notificationId },
      { status: newStatus, updatedAt: new Date().toISOString() },
      { field: 'status', value: conditionStatus },
    );
  }
}
