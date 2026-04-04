import { Injectable } from '@nestjs/common';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

@Injectable()
export class MarkBatchFailedPermanentUseCase {
  constructor(private readonly dbRepository: NotificationDbRepository) {}

  async execute(records: SqsMessage[]): Promise<void> {
    await Promise.all(
      records.map(record =>
        this.dbRepository.updateStatus(
          (record.body as NotificationEntity).notificationId,
          NotificationStatus.FAILED_PERMANENT,
        ),
      ),
    );
  }
}
