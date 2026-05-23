import { Injectable, Logger } from '@nestjs/common';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { OutboxEventType } from '../../../common/constants/outbox-event-type.constants';
import { OutboxEventDbRepository } from '../repository/outbox-event.db.repository';
import { BrokerPublishStrategy } from '../strategy/broker-publish.strategy';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class RelayService {
  private readonly logger = new Logger(RelayService.name);
  private readonly strategies: Map<OutboxEventType, BrokerPublishStrategy>;

  constructor(
    private readonly outboxEventDbRepository: OutboxEventDbRepository,
    notificationCreatedStrategy: BrokerPublishStrategy,
    notificationScheduledStrategy: BrokerPublishStrategy,
    webhookRequestedStrategy: BrokerPublishStrategy,
  ) {
    this.strategies = new Map([
      [OutboxEventType.NOTIFICATION_CREATED, notificationCreatedStrategy],
      [OutboxEventType.NOTIFICATION_SCHEDULED, notificationScheduledStrategy],
      [OutboxEventType.WEBHOOK_REQUESTED, webhookRequestedStrategy],
    ]);
  }

  async relay(event: OutboxEventEntity): Promise<void> {
    this.logger.log(`[PASO 1] Enrutando evento de outbox => eventId: ${event.eventId} | eventType: ${event.eventType}`);
    const strategy = this.strategies.get(event.eventType);
    if (!strategy) throw new CustomException(ErrorDictionary.UNRESOLVABLE_SENDER);
    await strategy.publish(event);

    this.logger.log(`[PASO 2] Marcando evento como publicado => eventId: ${event.eventId}`);
    await this.outboxEventDbRepository.markPublished(event.eventId, new Date().toISOString());
  }
}

