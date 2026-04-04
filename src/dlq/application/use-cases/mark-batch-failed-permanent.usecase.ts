import { Injectable } from '@nestjs/common';
import { WorkerRecord } from '../../../worker/application/parsers/sqs.parser';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';

@Injectable()
export class MarkBatchFailedPermanentUseCase {
  constructor(private readonly dbRepository: NotificationDbRepository) {}

  async execute(records: WorkerRecord[]): Promise<void> {
    await Promise.all(records.map(record => this.dbRepository.updateStatus(record.messageId, NotificationStatus.FAILED_PERMANENT)));
  }
}
