import { Injectable } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { BuildNotificationCommand } from '../commands/build-notification.command';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';

@Injectable()
export class NotificationService {
  constructor(
    private readonly defaultEmailProvider: NotificationProvider,
    private readonly defaultSmsProvider: NotificationProvider,
  ) {}

  build(command: BuildNotificationCommand): NotificationEntity {
    const provider = command.provider ?? this.resolveDefaultProvider(command.channel);
    return NotificationEntity.build({
      channel: command.channel,
      provider,
      to: command.to,
      subject: command.subject,
      body: command.body,
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
