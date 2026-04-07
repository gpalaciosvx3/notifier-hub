import { Injectable } from '@nestjs/common';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

@Injectable()
export class DlqBatchService {
  constructor(private readonly dbRepository: NotificationDbRepository) {}

  markFailed(record: SqsMessage): Promise<boolean> {
    const notificationId = (record.body as NotificationEntity).notificationId;
    return this.dbRepository.updateStatus(notificationId, NotificationStatus.FAILED_PERMANENT);
  }
}
