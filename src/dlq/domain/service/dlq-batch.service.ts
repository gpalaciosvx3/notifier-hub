import { Injectable, Logger } from '@nestjs/common';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { WebhookStatus } from '../../../common/constants/webhook-status.constants';
import { NotificationFailedMessage, WebhookFailedMessage } from '../types/dlq-message.types';
import { DlqOutboxEventMapper } from '../mapper/dlq-outbox-event.mapper';

@Injectable()
export class DlqBatchService {
  private readonly logger = new Logger(DlqBatchService.name);

  constructor(private readonly dbRepository: NotificationDbRepository) {}

  async handleNotificationFailed(msg: NotificationFailedMessage): Promise<void> {
    const { notificationId, callbackUrl } = msg;
    this.logger.log(
      `[PASO 1] Marcando notificación como fallida permanente => notificationId: ${notificationId}`,
    );
    const outboxEvent = DlqOutboxEventMapper.fromNotificationFailed({
      notificationId,
      callbackUrl,
    });
    this.logger.log(
      `[PASO 2] Persistiendo estado FAILED_PERMANENT y evento outbox atómicamente => notificationId: ${notificationId}`,
    );
    await this.dbRepository.updateStatusWithOutboxEvent(
      notificationId,
      NotificationStatus.FAILED_PERMANENT,
      outboxEvent,
    );
  }

  async handleWebhookFailed(msg: WebhookFailedMessage): Promise<void> {
    const { notificationId } = msg;
    this.logger.log(
      `[PASO 1] Actualizando webhookStatus a FAILED => notificationId: ${notificationId}`,
    );
    await this.dbRepository.updateWebhookStatus(notificationId, WebhookStatus.FAILED);
  }
}
