import { Injectable } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { ChannelRouterService } from './channel-router.service';

@Injectable()
export class ProcessingService {
  constructor(
    private readonly dbRepository: NotificationDbRepository,
    private readonly channelRouter: ChannelRouterService,
  ) {}

  async process(notification: NotificationEntity): Promise<void> {
    const taken = await this.dbRepository.updateStatusConditional(
      notification.notificationId,
      NotificationStatus.PROCESSING,
      NotificationStatus.PENDING,
    );
    if (taken) await this.sendAndFinalize(notification);
  }

  async handleFault(notification: NotificationEntity, _error: unknown): Promise<boolean> {
    await this.dbRepository.updateStatus(notification.notificationId, NotificationStatus.PENDING);
    return false;
  }

  private async sendAndFinalize(notification: NotificationEntity): Promise<void> {
    const sender = this.channelRouter.resolve(notification.channel, notification.provider);
    await sender.send(notification.to, notification.subject, notification.body);
    await this.dbRepository.updateStatus(notification.notificationId, NotificationStatus.DONE);
  }
}
