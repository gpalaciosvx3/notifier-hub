import { Injectable, Logger } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { NotificationSqsRepository } from '../repository/notification.sqs.repository';
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
    private readonly sqsRepository: NotificationSqsRepository,
  ) {
    this.defaultProviderByChannel = {
      [NotificationChannel.EMAIL]: defaultEmailProvider,
      [NotificationChannel.SMS]: defaultSmsProvider,
    };
  }

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
    const provider = input.provider ?? this.defaultProviderByChannel[input.channel];
    return NotificationMapper.fromInput(input, provider);
  }
}
