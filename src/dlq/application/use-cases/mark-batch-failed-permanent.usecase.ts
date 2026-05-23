import { Injectable, Logger } from '@nestjs/common';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { DlqBatchService } from '../../domain/service/dlq-batch.service';
import { DlqConstants } from '../constants/dlq.constants';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { executeChunkedBatch, classifyBatchFailure, summarizeBatchResults } from '../../../common/helpers/batch-processing.helper';
import { NotificationEntity } from '../../../common/entities/notification.entity';

@Injectable()
export class MarkBatchFailedPermanentUseCase {
  private readonly logger = new Logger(MarkBatchFailedPermanentUseCase.name);

  constructor(private readonly dlqBatchService: DlqBatchService) {}

  async executeBatch(records: SqsMessage[]): Promise<ProcessRecordResult[]> {
    this.logger.log(`Lote recibido => total: ${records.length}`);
    const results = await executeChunkedBatch(
      records,
      DlqConstants.SQS_CHUNK_SIZE,
      record => this.executeOne(record),
      (sequenceNumber, error) => this.classifyFailure(sequenceNumber, error),
    );
    const summary = summarizeBatchResults(results);
    this.logger.log(`Resultado batch => total: ${summary.total} | success: ${summary.success} | discarded: ${summary.discarded} | retryable: ${summary.retryable}`);
    return results;
  }

  private async executeOne(record: SqsMessage): Promise<void> {
    const notificationId = (record.body as NotificationEntity).notificationId;
    this.logger.log(`Procesando registro DLQ => notificationId: ${notificationId}`);
    await this.dlqBatchService.markFailed(record);
  }

  private classifyFailure(sequenceNumber: string, error: unknown): ProcessRecordResult {
    const reason = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Error al marcar registro => sequenceNumber: ${sequenceNumber} | reason: ${reason}`);
    return classifyBatchFailure(sequenceNumber, error);
  }
}

