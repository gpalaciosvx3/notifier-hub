import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationEntity } from '../../../common/entities/notification.entity';

@Injectable()
export class NotificationDbRepositoryImpl extends NotificationDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly tableName: string,
  ) {
    super();
  }

  async create(notificacion: NotificationEntity): Promise<void> {
    await this.dynamo.put(this.tableName, notificacion);
  }
}
