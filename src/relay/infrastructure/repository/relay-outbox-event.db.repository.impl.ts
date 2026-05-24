import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { OutboxEventDbRepository } from '../../domain/repository/relay-outbox-event.db.repository';

@Injectable()
export class OutboxEventDbRepositoryImpl extends OutboxEventDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly tableName: string,
  ) {
    super();
  }

  async markPublished(eventId: string, publishedAt: string): Promise<void> {
    await this.dynamo.updateFields(this.tableName, { eventId }, { publishedAt });
  }
}
