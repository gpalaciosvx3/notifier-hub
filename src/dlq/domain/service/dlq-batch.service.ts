import { Injectable, Logger } from '@nestjs/common';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { OutboxEventType } from '../../../common/constants/outbox-event-type.constants';
import { OutboxEventBrokerType } from '../../../common/constants/outbox-event-broker-type.constants';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { WebhookStatus } from '../../../common/constants/webhook-status.constants';
import { DlqMessage } from '../types/dlq-message.types';
import { DlqMessageType } from '../constants/dlq-message-type.constants';

@Injectable()
export class DlqBatchService {
  private readonly logger = new Logger(DlqBatchService.name);

  constructor(private readonly dbRepository: NotificationDbRepository) {}

  async handle(msg: DlqMessage): Promise<void> {
    if (msg.messageType === DlqMessageType.NOTIFICATION_FAILED) {
      await this.handleNotificationFailed(msg.notificationId, msg.callbackUrl);
      return;
    }
    await this.handleWebhookFailed(msg.notificationId);
  }

  private async handleNotificationFailed(notificationId: string, callbackUrl: string): Promise<void> {
    this.logger.log(
      `[PASO 1] Marcando notificación como fallida permanente => notificationId: ${notificationId}`,
    );
    const outboxEvent = OutboxEventEntity.build({
      eventType: OutboxEventType.WEBHOOK_REQUESTED,
      brokerType: OutboxEventBrokerType.SQS_WEBHOOK,
      payload: {
        notificationId,
        status: NotificationStatus.FAILED_PERMANENT,
        callbackUrl,
      },
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

  private async handleWebhookFailed(notificationId: string): Promise<void> {
    this.logger.log(
      `[PASO 1] Actualizando webhookStatus a FAILED => notificationId: ${notificationId}`,
    );
    await this.dbRepository.updateWebhookStatus(notificationId, WebhookStatus.FAILED);
  }
}
