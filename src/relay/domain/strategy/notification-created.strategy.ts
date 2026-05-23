import { Injectable } from '@nestjs/common';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { NotificationQueueSqsRepository } from '../repository/notification-queue.sqs.repository';
import { BrokerPublishStrategy } from './broker-publish.strategy';

@Injectable()
export class NotificationCreatedStrategy extends BrokerPublishStrategy {
  constructor(private readonly notificationQueueRepository: NotificationQueueSqsRepository) {
    super();
  }

  async publish(event: OutboxEventEntity): Promise<void> {
    await this.notificationQueueRepository.publish(JSON.stringify(event.payload));
  }
}
