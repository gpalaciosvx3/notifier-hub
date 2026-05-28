import { Injectable } from '@nestjs/common';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { OutboxEventType } from '../../../common/constants/outbox-event-type.constants';
import { OutboxEventDbRepository } from '../repository/relay-outbox-event.db.repository';
import { BrokerPublishStrategy } from '../strategy/relay-broker-publish.strategy';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { appLogger } from '../../../common/logger/lambda.logger';
import { appTracer } from '../../../common/tracer/lambda.tracer';

@Injectable()
export class RelayService {
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
    appTracer.annotate('notificationId', event.notificationId);
    appLogger.step(1, 'Validando estrategia de publicación', {
      eventId: event.eventId,
      eventType: event.eventType,
    });
    const strategy = this.strategies.get(event.eventType);
    if (!strategy) throw new CustomException(ErrorDictionary.UNRESOLVABLE_SENDER);

    appLogger.step(2, 'Publicando evento al broker', {
      eventId: event.eventId,
      eventType: event.eventType,
    });
    await appTracer.subsegment('brokerPublish', () => strategy.publish(event));

    appLogger.step(3, 'Marcando evento como publicado en DB', { eventId: event.eventId });
    await this.outboxEventDbRepository.markPublished(event.eventId, new Date().toISOString());
  }
}
