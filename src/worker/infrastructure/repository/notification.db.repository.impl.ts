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
    await this.dynamo.updateFields(this.tableName, { notificationId }, fields);
  }

  async updateStatusConditional(
    notificationId: string,
    newStatus: NotificationStatus,
    conditionStatus: NotificationStatus,
  ): Promise<boolean> {
    return this.dynamo.updateFieldsWithCondition(
      this.tableName,
      { notificationId },
      { status: newStatus, updatedAt: new Date().toISOString() },
      { field: 'status', value: conditionStatus },
    );
  }
}
