import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { WebhookStatus } from '../../../common/constants/webhook-status.constants';

@Injectable()
export class NotificationDbRepositoryImpl extends NotificationDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly tableName: string,
  ) {
    super();
  }

  async updateWebhookStatus(notificationId: string, status: WebhookStatus): Promise<void> {
    await this.dynamo.updateFields(
      this.tableName,
      { notificationId },
      {
        webhookStatus: status,
        updatedAt: new Date().toISOString(),
      },
    );
  }
}
