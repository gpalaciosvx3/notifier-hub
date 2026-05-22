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
    this.logger.log(`[PASO 1] Tomando control de notificación => notificationId: ${notification.notificationId}`);
    const taken = await this.dbRepository.updateStatusConditional(
      notification.notificationId,
      NotificationStatus.PROCESSING,
      NotificationStatus.PENDING,
    );
    if (!taken) return;
    await this.sendAndFinalize(notification);
  }

  async processSafe(notification: NotificationEntity): Promise<void> {
    try {
      await this.process(notification);
    } catch (error) {
      await this.handleFault(notification, error);
      throw error;
    }
  }

  async handleFault(notification: NotificationEntity, error: unknown): Promise<boolean> {
    const exception = error instanceof CustomException
      ? error
      : new CustomException(ErrorDictionary.NOTIFICATION_SEND_FAILED, error instanceof Error ? error.message : String(error));
    this.logger.error(`[PASO 1] Manejando fallo => notificationId: ${notification.notificationId} | [${exception.code}] ${exception.description}`);
    this.logger.log(`[PASO 2] Revirtiendo estado a PENDING => notificationId: ${notification.notificationId}`);
    await this.dbRepository.updateStatus(notification.notificationId, NotificationStatus.PENDING);
    return false;
  }

  private async sendAndFinalize(notification: NotificationEntity): Promise<void> {
    this.logger.log(`[PASO 2] Resolviendo remitente => channel: ${notification.channel} | provider: ${notification.provider}`);
    const sender = this.channelRouter.resolve(notification.channel, notification.provider);
    this.logger.log(`[PASO 3] Enviando notificación => notificationId: ${notification.notificationId} | to: ${notification.to}`);
    await sender.send(notification.to, notification.subject, notification.body);
    this.logger.log(`[PASO 4] Marcando notificación como DONE => notificationId: ${notification.notificationId}`);
    await this.dbRepository.updateStatus(notification.notificationId, NotificationStatus.DONE);
  }
}
