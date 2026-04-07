import { Injectable, Logger } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { ChannelRouterService } from './channel-router.service';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  constructor(
    private readonly dbRepository: NotificationDbRepository,
    private readonly channelRouter: ChannelRouterService,
  ) {}

  async process(notification: NotificationEntity): Promise<void> {
    const taken = await this.dbRepository.updateStatusConditional(
      notification.notificationId,
      NotificationStatus.PROCESSING,
      NotificationStatus.PENDING
    );
    this.logger.log(`Intentando procesar notificación ${notification.notificationId}. Tomada: ${taken}`);
    if (taken) await this.sendAndFinalize(notification);
  }

  async handleFault(notification: NotificationEntity, error: unknown): Promise<boolean> {
    const excepcion = error instanceof CustomException
      ? error
      : new CustomException(ErrorDictionary.NOTIFICATION_SEND_FAILED, error instanceof Error ? error.message : String(error));
    this.logger.error(`Fallo al procesar notificación ${notification.notificationId}: [${excepcion.code}] ${excepcion.description}`);
    await this.dbRepository.updateStatus(notification.notificationId, NotificationStatus.PENDING);
    return false;
  }

  private async sendAndFinalize(notification: NotificationEntity): Promise<void> {
    const sender = this.channelRouter.resolve(notification.channel, notification.provider);
    await sender.send(notification.to, notification.subject, notification.body);
    await this.dbRepository.updateStatus(notification.notificationId, NotificationStatus.DONE);
  }
}
