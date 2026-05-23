import { Injectable, Logger } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { OutboxEventType } from '../../../common/constants/outbox-event-type.constants';
import { OutboxEventBrokerType } from '../../../common/constants/outbox-event-broker-type.constants';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { NotificationInput } from '../types/notification-input.types';
import { NotificationMapper } from '../mapper/notification.mapper';

@Injectable()
export class EnqueueNotificationService {
  private readonly logger = new Logger(EnqueueNotificationService.name);
  private readonly defaultProviderByChannel: Record<NotificationChannel, NotificationProvider>;

  constructor(
    defaultEmailProvider: NotificationProvider,
    defaultSmsProvider: NotificationProvider,
    private readonly dbRepository: NotificationDbRepository,
  ) {
    this.defaultProviderByChannel = {
      [NotificationChannel.EMAIL]: defaultEmailProvider,
      [NotificationChannel.SMS]: defaultSmsProvider,
    };
  }

  async enqueue(input: NotificationInput): Promise<string> {
    const provider = input.provider ?? this.defaultProviderByChannel[input.channel];

    this.logger.log(
      `[PASO 1] Construyendo entidades => channel: ${input.channel} | to: ${input.to}`,
    );
    const { notification, outboxEvent } = this.buildPayload(input, provider);

    this.logger.log(
      `[PASO 2] Persistiendo notificación + evento de outbox atómicamente => notificationId: ${notification.notificationId} | eventId: ${outboxEvent.eventId}`,
    );
    await this.dbRepository.createWithOutboxEvent(notification, outboxEvent);

    return notification.notificationId;
  }

  build(input: NotificationInput): NotificationEntity {
    const provider = input.provider ?? this.defaultProviderByChannel[input.channel];
    return NotificationMapper.fromInput(input, provider);
  }

  private buildPayload(
    input: NotificationInput,
    provider: NotificationProvider,
  ): { notification: NotificationEntity; outboxEvent: OutboxEventEntity } {
    if (input.scheduledAt) {
      const notification = NotificationMapper.fromScheduledInput(input, provider);
      return {
        notification,
        outboxEvent: OutboxEventEntity.build({
          eventType: OutboxEventType.NOTIFICATION_SCHEDULED,
          brokerType: OutboxEventBrokerType.SQS_NOTIFICATION,
          payload: {
            notification: notification as unknown as Record<string, unknown>,
            scheduledAt: input.scheduledAt,
          },
        }),
      };
    }

    const notification = NotificationMapper.fromInput(input, provider);
    return {
      notification,
      outboxEvent: OutboxEventEntity.build({
        eventType: OutboxEventType.NOTIFICATION_CREATED,
        brokerType: OutboxEventBrokerType.SQS_NOTIFICATION,
        payload: notification as unknown as Record<string, unknown>,
      }),
    };
  }
}
