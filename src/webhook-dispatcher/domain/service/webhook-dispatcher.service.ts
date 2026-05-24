import { Injectable, Logger } from '@nestjs/common';
import { WebhookEvent, WebhookCallbackPayload } from '../types/webhook-dispatcher-event.types';
import { WebhookStatus } from '../../../common/constants/webhook-status.constants';
import { NotificationDbRepository } from '../repository/webhook-dispatcher-notification.db.repository';
import { CallbackHttpRepository } from '../repository/webhook-dispatcher-callback.http.repository';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly dbRepository: NotificationDbRepository,
    private readonly callbackRepository: CallbackHttpRepository,
  ) {}

  async dispatch(event: WebhookEvent): Promise<void> {
    const payload: WebhookCallbackPayload = {
      notificationId: event.notificationId,
      status: event.status,
    };
    this.logger.log(
      `[PASO 1] Intentando POST al callbackUrl => notificationId: ${event.notificationId} | callbackUrl: ${event.callbackUrl}`,
    );
    const delivered = await this.callbackRepository.post(event.callbackUrl, payload);
    if (delivered) {
      this.logger.log(
        `[PASO 2] Actualizando webhookStatus a DELIVERED => notificationId: ${event.notificationId}`,
      );
      await this.dbRepository.updateWebhookStatus(event.notificationId, WebhookStatus.DELIVERED);
      return;
    }
    this.logger.log(
      `[PASO 2] Fallaron todos los reintentos => notificationId: ${event.notificationId} — relanzando para reintento SQS`,
    );
    throw new CustomException(ErrorDictionary.WEBHOOK_POST_FAILED, event.notificationId);
  }
}
