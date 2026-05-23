import { Injectable } from '@nestjs/common';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { SchedulerRepository } from '../repository/scheduler.repository';
import { BrokerPublishStrategy } from './broker-publish.strategy';
import { NotificationScheduledPayload } from '../types/relay-input.types';

@Injectable()
export class NotificationScheduledStrategy extends BrokerPublishStrategy {
  constructor(
    private readonly schedulerRepository: SchedulerRepository,
    private readonly notificationsQueueUrl: string,
  ) {
    super();
  }

  async publish(event: OutboxEventEntity): Promise<void> {
    const scheduled = event.payload as unknown as NotificationScheduledPayload;
    await this.schedulerRepository.schedule(
      JSON.stringify(scheduled.notification),
      scheduled.scheduledAt,
      this.notificationsQueueUrl,
    );
  }
}
