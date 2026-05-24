import { WebhookCallbackPayload } from '../types/webhook-dispatcher-event.types';

export abstract class CallbackHttpRepository {
  abstract post(url: string, payload: WebhookCallbackPayload): Promise<boolean>;
}
