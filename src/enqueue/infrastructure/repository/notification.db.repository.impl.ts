import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationEntity } from '../../../common/entities/notification.entity';
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

  async createWithOutboxEvent(
    notification: NotificationEntity,
    outboxEvent: OutboxEventEntity,
  ): Promise<void> {
    await this.dynamo.transactWrite([
      { type: 'put', table: this.tableName, item: notification },
      { type: 'put', table: this.outboxTableName, item: outboxEvent },
    ]);
  }
}
