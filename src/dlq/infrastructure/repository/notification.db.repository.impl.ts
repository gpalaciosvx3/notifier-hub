import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
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

  async updateStatus(notificationId: string, status: NotificationStatus): Promise<boolean> {
    return this.dynamo.updateIfExists(
      this.tableName,
      { notificationId },
      { status, updatedAt: new Date().toISOString() },
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
