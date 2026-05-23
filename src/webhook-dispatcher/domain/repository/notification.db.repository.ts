import { WebhookStatus } from '../../../common/constants/webhook-status.constants';

export abstract class NotificationDbRepository {
  abstract updateWebhookStatus(notificationId: string, status: WebhookStatus): Promise<void>;
}
