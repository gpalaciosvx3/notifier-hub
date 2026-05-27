import { Injectable } from '@nestjs/common';
import { WebhookEvent, WebhookCallbackPayload } from '../types/webhook-dispatcher-event.types';
import { WebhookStatus } from '../../../common/constants/webhook-status.constants';
import { NotificationDbRepository } from '../repository/webhook-dispatcher-notification.db.repository';
import { CallbackHttpRepository } from '../repository/webhook-dispatcher-callback.http.repository';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { appLogger } from '../../../common/logger/lambda.logger';
import { appTracer } from '../../../common/tracer/lambda.tracer';
import { appMetrics } from '../../../common/metrics/lambda.metrics';

@Injectable()
export class DispatchService {
  constructor(
    private readonly dbRepository: NotificationDbRepository,
    private readonly callbackRepository: CallbackHttpRepository,
  ) {}

  async dispatch(event: WebhookEvent): Promise<void> {
    appTracer.annotate('notificationId', event.notificationId);
    const payload: WebhookCallbackPayload = {
      notificationId: event.notificationId,
      status: event.status,
    };

    appLogger.step(1, 'Intentando POST al callbackUrl', { notificationId: event.notificationId });

    const delivered = await appTracer.subsegment('httpPost', () =>
      this.callbackRepository.post(event.callbackUrl, payload),
    );

    if (delivered) {
      appLogger.step(2, 'Actualizando webhookStatus a DELIVERED', { notificationId: event.notificationId });
      await this.dbRepository.updateWebhookStatus(event.notificationId, WebhookStatus.DELIVERED);
      appMetrics.add('webhooks_delivered');
      return;
    }

    appLogger.step(2, 'Fallaron todos los reintentos — relanzando para reintento SQS', { notificationId: event.notificationId });
    throw new CustomException(ErrorDictionary.WEBHOOK_POST_FAILED, event.notificationId);
  }
}
