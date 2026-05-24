import { Injectable } from '@nestjs/common';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { WebhookQueueSqsRepository } from '../repository/relay-webhook-queue.sqs.repository';
import { BrokerPublishStrategy } from './relay-broker-publish.strategy';

@Injectable()
export class WebhookRequestedStrategy extends BrokerPublishStrategy {
  constructor(private readonly webhookQueueRepository: WebhookQueueSqsRepository) {
    super();
  }

  async publish(event: OutboxEventEntity): Promise<void> {
    await this.webhookQueueRepository.publish(JSON.stringify(event.payload));
  }
}
