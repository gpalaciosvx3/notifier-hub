import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { OutboxEventType } from '../../../common/constants/outbox-event-type.constants';
import { OutboxEventBrokerType } from '../../../common/constants/outbox-event-broker-type.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { NotificationInput } from '../types/notification-input.types';
import { EnqueuePayload } from '../types/enqueue-payload.types';
import { NotificationMapper } from './notification.mapper';

export class EnqueuePayloadMapper {
  static fromInput(input: NotificationInput, provider: NotificationProvider): EnqueuePayload {
    if (input.scheduledAt) {
      const notification = NotificationMapper.fromScheduledInput(input, provider);
      return {
        notification,
        outboxEvent: OutboxEventEntity.build({
          eventType: OutboxEventType.NOTIFICATION_SCHEDULED,
          brokerType: OutboxEventBrokerType.SCHEDULER,
          payload: {
            notification: notification as unknown as Record<string, unknown>,
            scheduledAt: input.scheduledAt,
          },
        }),
      };
    }

    const notification = NotificationMapper.fromInput(input, provider);
    return {
      notification,
      outboxEvent: OutboxEventEntity.build({
        eventType: OutboxEventType.NOTIFICATION_CREATED,
        brokerType: OutboxEventBrokerType.SQS_NOTIFICATION,
        payload: notification as unknown as Record<string, unknown>,
      }),
    };
  }
}
