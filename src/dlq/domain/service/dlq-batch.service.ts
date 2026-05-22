import { Injectable, Logger } from '@nestjs/common';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

@Injectable()
export class DlqBatchService {
  private readonly logger = new Logger(DlqBatchService.name);

  constructor(private readonly dbRepository: NotificationDbRepository) {}

  markFailed(record: SqsMessage): Promise<boolean> {
    const notificationId = (record.body as NotificationEntity).notificationId;
    this.logger.log(`[PASO 1] Marcando notificación como fallida permanente => notificationId: ${notificationId}`);
    return this.dbRepository.updateStatus(notificationId, NotificationStatus.FAILED_PERMANENT);
  }
}
