import { Injectable } from '@nestjs/common';
import { SQSBatchResponse } from 'aws-lambda';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { ProcessingService } from '../../domain/service/processing.service';

@Injectable()
export class ProcessBatchUseCase {
  constructor(private readonly processingService: ProcessingService) {}

  async execute(records: SqsMessage[]): Promise<SQSBatchResponse> {
    const results = await Promise.all(records.map(r => this.processRecord(r)));
    return { batchItemFailures: results.filter(Boolean) as { itemIdentifier: string }[] };
  }

  private async processRecord(record: SqsMessage): Promise<{ itemIdentifier: string } | null> {
    const notification = record.body as NotificationEntity;
    try {
      await this.processingService.process(notification);
      return null;
    } catch (error) {
      const handled = await this.processingService.handleFault(notification, error);
      return handled ? null : { itemIdentifier: record.messageId };
    }
  }
}
