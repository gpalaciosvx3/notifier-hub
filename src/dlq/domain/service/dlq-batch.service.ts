import { Injectable, Logger } from '@nestjs/common';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { OutboxEventType } from '../../../common/constants/outbox-event-type.constants';
import { OutboxEventBrokerType } from '../../../common/constants/outbox-event-broker-type.constants';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

@Injectable()
export class DlqBatchService {
  private readonly logger = new Logger(DlqBatchService.name);

  constructor(private readonly dbRepository: NotificationDbRepository) {}

  async markFailed(record: SqsMessage): Promise<boolean> {
    const entity = record.body as NotificationEntity;
    const { notificationId, callbackUrl } = entity;
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
    await this.dbRepository.updateStatusWithOutboxEvent(
      notificationId,
      NotificationStatus.FAILED_PERMANENT,
      outboxEvent,
    );
    return true;
  }
}
