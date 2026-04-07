import { Injectable, Logger } from '@nestjs/common';
import { SQSBatchResponse } from 'aws-lambda';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { ProcessingService } from '../../domain/service/processing.service';

@Injectable()
export class ProcessBatchUseCase {
  private readonly logger = new Logger(ProcessBatchUseCase.name);

  constructor(private readonly processingService: ProcessingService) {}

  async execute(records: SqsMessage[]): Promise<SQSBatchResponse> {
    const outcomes = await Promise.allSettled(records.map(r => this.processRecord(r)));

    const fulfilled = outcomes.filter((o): o is PromiseFulfilledResult<{ itemIdentifier: string } | null> => o.status === 'fulfilled');
    const batchItemFailures = fulfilled.filter(o => o.value !== null).map(o => o.value as { itemIdentifier: string });
    const success = fulfilled.filter(o => o.value === null).length;
    const failed = outcomes.filter(o => o.status === 'rejected').length;

    this.logger.log(`Resultado => Total: ${records.length} | Exitosos: ${success} | Reintentables: ${batchItemFailures.length} | Fallidos: ${failed}`);

    return { batchItemFailures };
  }

  private async processRecord(record: SqsMessage): Promise<{ itemIdentifier: string } | null> {
    const notification = record.body as NotificationEntity;
    this.logger.log(`Procesando notificación: ${JSON.stringify(notification)}`);
    try {
      await this.processingService.process(notification);
      return null;
    } catch (error) {
      const handled = await this.processingService.handleFault(notification, error);
      return handled ? null : { itemIdentifier: record.messageId };
    }
  }
}
