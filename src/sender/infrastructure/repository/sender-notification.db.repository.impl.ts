import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/sender-notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';

@Injectable()
export class NotificationDbRepositoryImpl extends NotificationDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly tableName: string,
    private readonly outboxTableName: string,
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

  async updateStatusWithOutboxEvent(
    notificationId: string,
    status: NotificationStatus,
    outboxEvent: OutboxEventEntity,
  ): Promise<void> {
    await this.dynamo.transactWrite([
      {
        type: 'update',
        table: this.tableName,
        key: { notificationId },
        fields: { status, updatedAt: new Date().toISOString() },
      },
      { type: 'put', table: this.outboxTableName, item: outboxEvent },
    ]);
  }
}
