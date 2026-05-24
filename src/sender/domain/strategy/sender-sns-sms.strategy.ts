import { Injectable } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { SnsSenderRepository } from '../repository/sender-channel.repository';
import { NotificationSendStrategy } from './sender-notification-send.strategy';

@Injectable()
export class SnsSmsStrategy extends NotificationSendStrategy {
  constructor(private readonly snsSender: SnsSenderRepository) {
    super();
  }

  async send(notification: NotificationEntity): Promise<void> {
    await this.snsSender.send(notification.to, notification.subject, notification.body);
  }
}
