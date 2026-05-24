import { WebhookCallbackPayload } from '../types/webhook-event.types';

export abstract class CallbackHttpRepository {
  abstract post(url: string, payload: WebhookCallbackPayload): Promise<boolean>;
}
