import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/enqueue-notification.db.repository';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { EnqueueConstants } from '../../domain/constants/enqueue.constants';
import { TransactWriteOperation } from '../../../common/dynamo/types/transact-write-operation.types';

type IdempotencyRecord = {
  notificationId: string;
  result: string;
  ttl: number;
};

@Injectable()
export class NotificationDbRepositoryImpl extends NotificationDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly tableName: string,
    private readonly outboxTableName: string,
  ) {
    super();
  }

  async findNotificationIdByIdempotencyKey(key: string): Promise<string | null> {
    const record = await this.dynamo.get<IdempotencyRecord>(this.tableName, {
      notificationId: `${EnqueueConstants.IDEMPOTENCY_KEY_PREFIX}${key}`,
    });
    return record?.result ?? null;
  }

  async createWithOutboxEvent(
    notification: NotificationEntity,
    outboxEvent: OutboxEventEntity,
    idempotencyKey: string,
  ): Promise<void> {
    const operations: TransactWriteOperation[] = [
      { type: 'put', table: this.tableName, item: notification },
      { type: 'put', table: this.outboxTableName, item: outboxEvent },
    ];

    const idempotencyRecord: IdempotencyRecord = {
      notificationId: `${EnqueueConstants.IDEMPOTENCY_KEY_PREFIX}${idempotencyKey}`,
      result: notification.notificationId,
      ttl: Math.floor(Date.now() / 1000) + EnqueueConstants.IDEMPOTENCY_TTL_SECONDS,
    };
    operations.push({ type: 'put', table: this.tableName, item: idempotencyRecord });

    await this.dynamo.transactWrite(operations);
  }
}
