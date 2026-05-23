import { Injectable } from '@nestjs/common';
import { SqsClient } from '../../../common/sqs/sqs.client';
import { NotificationQueueSqsRepository } from '../../domain/repository/notification-queue.sqs.repository';

@Injectable()
export class NotificationQueueSqsRepositoryImpl extends NotificationQueueSqsRepository {
  constructor(
    private readonly sqsClient: SqsClient,
    private readonly queueUrl: string,
  ) {
    super();
  }

  async publish(payload: string): Promise<void> {
    await this.sqsClient.sendMessage(this.queueUrl, payload);
  }
}
