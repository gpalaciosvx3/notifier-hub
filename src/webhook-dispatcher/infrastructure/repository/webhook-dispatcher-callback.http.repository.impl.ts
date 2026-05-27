import { Injectable } from '@nestjs/common';
import { CallbackHttpRepository } from '../../domain/repository/webhook-dispatcher-callback.http.repository';
import { WebhookCallbackPayload } from '../../domain/types/webhook-dispatcher-event.types';
import { WebhookDispatcherConstants } from '../constants/webhook-dispatcher.constants';
import { appLogger } from '../../../common/logger/lambda.logger';

@Injectable()
export class CallbackHttpRepositoryImpl extends CallbackHttpRepository {
  async post(url: string, payload: WebhookCallbackPayload): Promise<boolean> {
    for (let attempt = 0; attempt < WebhookDispatcherConstants.MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = WebhookDispatcherConstants.RETRY_DELAYS_MS[attempt - 1];
        appLogger.info('Reintentando webhook POST', {
          attempt,
          maxRetries: WebhookDispatcherConstants.MAX_RETRIES - 1,
          delayMs,
          notificationId: payload.notificationId,
        });
        await this.sleep(delayMs);
      }
      const success = await this.trySend(url, payload);
      if (success) return true;
    }
    return false;
  }

  private async trySend(url: string, payload: WebhookCallbackPayload): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
