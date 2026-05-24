import { Injectable } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { SesSenderRepository } from '../repository/notification.sender.repository';
import { NotificationSendStrategy } from './notification-send.strategy';

@Injectable()
export class SesEmailStrategy extends NotificationSendStrategy {
  constructor(private readonly sesSender: SesSenderRepository) {
    super();
  }

  async send(notification: NotificationEntity): Promise<void> {
    await this.sesSender.send(notification.to, notification.subject, notification.body);
  }
}
