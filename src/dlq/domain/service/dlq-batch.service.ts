import { Injectable } from '@nestjs/common';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { DlqBatchResult } from '../types/dlq-batch-result.type';

@Injectable()
export class DlqBatchService {
  constructor(private readonly dbRepository: NotificationDbRepository) {}

  async markAllFailed(records: SqsMessage[]): Promise<DlqBatchResult> {
    const outcomes = await Promise.allSettled(
      records.map(record => {
        const notificationId = (record.body as NotificationEntity).notificationId;
        return this.dbRepository.updateStatus(notificationId, NotificationStatus.FAILED_PERMANENT);
      }),
    );

    console.log('DLQ Batch Update Outcomes:', outcomes);

    const fulfilled = outcomes.filter((o): o is PromiseFulfilledResult<boolean> => o.status === 'fulfilled');
    const updated = fulfilled.filter(o => o.value).length;
    const notFound = fulfilled.filter(o => !o.value).length;
    const failed = outcomes.filter(o => o.status === 'rejected').length;

    return { total: records.length, updated, notFound, failed };
  }
}
