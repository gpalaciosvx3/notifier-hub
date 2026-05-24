import { Injectable, Logger } from '@nestjs/common';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { ProcessingService } from '../../domain/service/sender.service';
import { SenderConstants } from '../constants/sender.constants';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import {
  executeChunkedBatch,
  classifyBatchFailure,
  summarizeBatchResults,
} from '../../../common/helpers/batch-processing.helper';

@Injectable()
export class ProcessBatchUseCase {
  private readonly logger = new Logger(ProcessBatchUseCase.name);

  constructor(private readonly processingService: ProcessingService) {}

  async executeBatch(records: SqsMessage[]): Promise<ProcessRecordResult[]> {
    this.logger.log(`Lote recibido => total: ${records.length}`);
    const results = await executeChunkedBatch(
      records,
      SenderConstants.SQS_CHUNK_SIZE,
      (record) => this.executeOne(record),
      (sequenceNumber, error) => this.classifyFailure(sequenceNumber, error),
    );
    const summary = summarizeBatchResults(results);
    this.logger.log(
      `Resultado batch => total: ${summary.total} | success: ${summary.success} | discarded: ${summary.discarded} | retryable: ${summary.retryable}`,
    );
    return results;
  }

  private async executeOne(record: SqsMessage): Promise<void> {
    const notification = record.body as NotificationEntity;
    this.logger.log(`Procesando notificación => notificationId: ${notification.notificationId}`);
    await this.processingService.processSafe(notification);
  }

  private classifyFailure(sequenceNumber: string, error: unknown): ProcessRecordResult {
    const reason = error instanceof Error ? error.message : String(error);
    this.logger.warn(
      `Error al procesar registro => sequenceNumber: ${sequenceNumber} | reason: ${reason}`,
    );
    return classifyBatchFailure(sequenceNumber, error);
  }
}
