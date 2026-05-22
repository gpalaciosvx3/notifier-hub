import { Injectable, Logger } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { NotificationSqsRepository } from '../repository/notification.sqs.repository';
import { NotificationInput } from '../types/notification-input.types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly defaultEmailProvider: NotificationProvider,
    private readonly defaultSmsProvider: NotificationProvider,
    private readonly dbRepository: NotificationDbRepository,
    private readonly sqsRepository: NotificationSqsRepository,
  ) {}

  async enqueue(input: NotificationInput): Promise<string> {
    this.logger.log(`[PASO 1] Construyendo entidad de notificación => channel: ${input.channel} | to: ${input.to}`);
    const notification = this.build(input);

    this.logger.log(`[PASO 2] Persistiendo notificación => notificationId: ${notification.notificationId}`);
    await this.dbRepository.create(notification);

    this.logger.log(`[PASO 3] Encolando notificación => notificationId: ${notification.notificationId}`);
    await this.sqsRepository.enqueue(notification);

    return notification.notificationId;
  }

  build(input: NotificationInput): NotificationEntity {
    const provider = input.provider ?? this.resolveDefaultProvider(input.channel);
    return NotificationEntity.build({
      channel: input.channel,
      provider,
      to: input.to,
      subject: input.subject,
      body: input.body,
    });
  }

  private resolveDefaultProvider(channel: NotificationChannel): NotificationProvider {
    const defaultProvider: Record<NotificationChannel, NotificationProvider> = {
      [NotificationChannel.EMAIL]: this.defaultEmailProvider,
      [NotificationChannel.SMS]: this.defaultSmsProvider,
    };
    return defaultProvider[channel];
  }
}
