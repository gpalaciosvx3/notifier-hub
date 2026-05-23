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
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
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
    this.logger.log(
      `[PASO 1] Construyendo entidad de notificación => channel: ${input.channel} | to: ${input.to}`,
    );
    const notification = this.build(input);

    this.logger.log(
      `[PASO 2] Construyendo evento de outbox => notificationId: ${notification.notificationId}`,
    );
    const outboxEvent = OutboxEventEntity.build({
      eventType: OutboxEventType.NOTIFICATION_CREATED,
      brokerType: OutboxEventBrokerType.SQS_NOTIFICATION,
      payload: notification as unknown as Record<string, unknown>,
    });

    this.logger.log(
      `[PASO 3] Persistiendo notificación + evento de outbox atómicamente => notificationId: ${notification.notificationId} | eventId: ${outboxEvent.eventId}`,
    );
    await this.dbRepository.createWithOutboxEvent(notification, outboxEvent);

    return notification.notificationId;
  }

  build(input: NotificationInput): NotificationEntity {
    const provider = input.provider ?? this.defaultProviderByChannel[input.channel];
    return NotificationMapper.fromInput(input, provider);
  }
}
