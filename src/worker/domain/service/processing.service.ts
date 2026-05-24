import { Injectable, Logger } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { OutboxEventType } from '../../../common/constants/outbox-event-type.constants';
import { OutboxEventBrokerType } from '../../../common/constants/outbox-event-broker-type.constants';
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
      ));
    if (!taken) return;
    await this.sendAndFinalize(notification);
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

  private async sendAndFinalize(notification: NotificationEntity): Promise<void> {
    this.logger.log(
      `[PASO 2] Resolviendo remitente => channel: ${notification.channel} | provider: ${notification.provider}`,
    );
    const sender = this.channelRouter.resolve(notification.channel, notification.provider);
    this.logger.log(
      `[PASO 3] Enviando notificación => notificationId: ${notification.notificationId} | to: ${notification.to}`,
    );
    await sender.send(notification.to, notification.subject, notification.body);
    this.logger.log(
      `[PASO 4] Marcando notificación como SENT => notificationId: ${notification.notificationId}`,
    );
    const outboxEvent = OutboxEventEntity.build({
      eventType: OutboxEventType.WEBHOOK_REQUESTED,
      brokerType: OutboxEventBrokerType.SQS_WEBHOOK,
      payload: {
        notificationId: notification.notificationId,
        status: NotificationStatus.SENT,
        callbackUrl: notification.callbackUrl,
        sentAt: new Date().toISOString(),
      },
    });
    await this.dbRepository.updateStatusWithOutboxEvent(
      notification.notificationId,
      NotificationStatus.SENT,
      outboxEvent,
    );
  }
}
