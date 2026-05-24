import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { OutboxEventType } from '../../../common/constants/outbox-event-type.constants';
import { OutboxEventBrokerType } from '../../../common/constants/outbox-event-broker-type.constants';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

export class WebhookOutboxEventMapper {
  static fromSent(params: {
    notificationId: string;
    callbackUrl: string;
    sentAt: string;
  }): OutboxEventEntity {
    return OutboxEventEntity.build({
      eventType: OutboxEventType.WEBHOOK_REQUESTED,
      brokerType: OutboxEventBrokerType.SQS_WEBHOOK,
      notificationId: params.notificationId,
      payload: {
        notificationId: params.notificationId,
        status: NotificationStatus.SENT,
        callbackUrl: params.callbackUrl,
        sentAt: params.sentAt,
      },
    });
  }
}
