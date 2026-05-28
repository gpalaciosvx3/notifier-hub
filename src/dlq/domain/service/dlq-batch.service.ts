import { Injectable } from '@nestjs/common';
import { NotificationDbRepository } from '../repository/dlq-notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { WebhookStatus } from '../../../common/constants/webhook-status.constants';
import { NotificationFailedMessage, WebhookFailedMessage } from '../types/dlq-message.types';
import { DlqOutboxEventMapper } from '../mapper/dlq-outbox-event.mapper';
import { appLogger } from '../../../common/logger/lambda.logger';
import { appTracer } from '../../../common/tracer/lambda.tracer';
import { appMetrics } from '../../../common/metrics/lambda.metrics';

@Injectable()
export class DlqBatchService {
  constructor(private readonly dbRepository: NotificationDbRepository) {}

  async handleNotificationFailed(msg: NotificationFailedMessage): Promise<void> {
    const { notificationId, callbackUrl } = msg;
    appTracer.annotate('notificationId', notificationId);
    appLogger.step(1, 'Marcando notificación como fallida permanente', { notificationId });
    const outboxEvent = DlqOutboxEventMapper.fromNotificationFailed({
      notificationId,
      callbackUrl,
    });
    appLogger.step(2, 'Persistiendo estado FAILED_PERMANENT y evento outbox atómicamente', {
      notificationId,
    });
    await this.dbRepository.updateStatusWithOutboxEvent(
      notificationId,
      NotificationStatus.FAILED_PERMANENT,
      outboxEvent,
    );
    appMetrics.add('notifications_failed_permanent');
  }

  async handleWebhookFailed(msg: WebhookFailedMessage): Promise<void> {
    const { notificationId } = msg;
    appTracer.annotate('notificationId', notificationId);
    appLogger.step(1, 'Actualizando webhookStatus a FAILED', { notificationId });
    await this.dbRepository.updateWebhookStatus(notificationId, WebhookStatus.FAILED);
    appMetrics.add('webhooks_failed_permanent');
  }
}
