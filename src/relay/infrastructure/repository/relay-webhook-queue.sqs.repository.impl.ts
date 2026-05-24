import { Injectable } from '@nestjs/common';
import { SqsClient } from '../../../common/sqs/sqs.client';
import { WebhookQueueSqsRepository } from '../../domain/repository/relay-webhook-queue.sqs.repository';

@Injectable()
export class WebhookQueueSqsRepositoryImpl extends WebhookQueueSqsRepository {
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
