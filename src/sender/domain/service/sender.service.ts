import { Injectable, Logger } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { NotificationDbRepository } from '../repository/sender-notification.db.repository';
import { NotificationSendStrategy } from '../strategy/sender-notification-send.strategy';
import { WebhookOutboxEventMapper } from '../mapper/sender-webhook-outbox-event.mapper';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);
  private readonly strategies: Map<string, NotificationSendStrategy>;

  constructor(
    private readonly dbRepository: NotificationDbRepository,
    sesEmailStrategy: NotificationSendStrategy,
    snsSmsStrategy: NotificationSendStrategy,
  ) {
    this.strategies = new Map([
      [`${NotificationChannel.EMAIL}:${NotificationProvider.SES}`, sesEmailStrategy],
      [`${NotificationChannel.SMS}:${NotificationProvider.SNS}`, snsSmsStrategy],
    ]);
  }

  async processSafe(notification: NotificationEntity): Promise<void> {
    try {
      await this.process(notification);
    } catch (error) {
      await this.handleFault(notification, error);
      throw error;
    }
  }

  private async process(notification: NotificationEntity): Promise<void> {
    this.logger.log(
      `[PASO 1] Tomando control de notificación => notificationId: ${notification.notificationId}`,
    );
    const taken =
      (await this.dbRepository.updateStatusConditional(
        notification.notificationId,
        NotificationStatus.PROCESSING,
        NotificationStatus.PENDING,
      )) ||
      (await this.dbRepository.updateStatusConditional(
        notification.notificationId,
        NotificationStatus.PROCESSING,
        NotificationStatus.SCHEDULED,
      )) ||
      (await this.dbRepository.updateStatusConditional(
        notification.notificationId,
        NotificationStatus.PROCESSING,
        NotificationStatus.PROCESSING,
      ));
    if (!taken) return;
    await this.sendAndFinalize(notification);
  }

  private async sendAndFinalize(notification: NotificationEntity): Promise<void> {
    const key = `${notification.channel}:${notification.provider}`;
    this.logger.log(`[PASO 2] Resolviendo estrategia de envío => key: ${key}`);
    const strategy = this.strategies.get(key);
    if (!strategy) throw new CustomException(ErrorDictionary.UNRESOLVABLE_SENDER, key);
    this.logger.log(
      `[PASO 3] Enviando notificación => notificationId: ${notification.notificationId} | to: ${notification.to}`,
    );
    await strategy.send(notification);
    this.logger.log(
      `[PASO 4] Marcando notificación como SENT => notificationId: ${notification.notificationId}`,
    );
    const outboxEvent = WebhookOutboxEventMapper.fromSent({
      notificationId: notification.notificationId,
      callbackUrl: notification.callbackUrl,
      sentAt: new Date().toISOString(),
    });
    await this.dbRepository.updateStatusWithOutboxEvent(
      notification.notificationId,
      NotificationStatus.SENT,
      outboxEvent,
    );
  }

  private async handleFault(notification: NotificationEntity, error: unknown): Promise<boolean> {
    this.logger.error(`[PASO 1] Manejando fallo => notificationId: ${notification.notificationId}`);
    const exception =
      error instanceof CustomException
        ? error
        : new CustomException(
            ErrorDictionary.NOTIFICATION_SEND_FAILED,
            error instanceof Error ? error.message : String(error),
          );
    this.logger.log(
      `[PASO 2] Revirtiendo estado a PENDING => notificationId: ${notification.notificationId} | [${exception.code}] ${exception.description}`,
    );
    await this.dbRepository.updateStatus(notification.notificationId, NotificationStatus.PENDING);
    return false;
  }
}
