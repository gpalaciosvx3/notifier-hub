import { Injectable, Logger } from '@nestjs/common';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { DlqBatchService } from '../../domain/service/dlq-batch.service';
import { DlqConstants } from '../constants/dlq.constants';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import {
  executeChunkedBatch,
  classifyBatchFailure,
  summarizeBatchResults,
} from '../../../common/helpers/batch-processing.helper';
import { DlqMessageSchema } from '../dtos/dlq-message.request.dto';

@Injectable()
export class MarkBatchFailedPermanentUseCase {
  private readonly logger = new Logger(MarkBatchFailedPermanentUseCase.name);

  constructor(private readonly dlqBatchService: DlqBatchService) {}

  async executeBatch(records: SqsMessage[]): Promise<ProcessRecordResult[]> {
    this.logger.log(`Lote recibido => total: ${records.length}`);
    const results = await executeChunkedBatch(
      records,
      DlqConstants.SQS_CHUNK_SIZE,
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
    this.logger.log(`Body recibido: ${JSON.stringify(record.body)}`);
    const result = DlqMessageSchema.safeParse(record.body);
    if (!result.success) {
      this.logger.warn(
        `Mensaje con messageType desconocido — descartando => sequenceNumber: ${record.sequenceNumber}`,
      );
      return;
    }
    const msg = result.data;
    this.logger.log(
      `Mensaje validado => notificationId: ${msg.notificationId} | messageType: ${msg.messageType}`,
    );
    await this.dlqBatchService.handle(msg);
    this.logger.log(`Resultado => notificationId: ${msg.notificationId} | processed`);
  }

  private classifyFailure(sequenceNumber: string, error: unknown): ProcessRecordResult {
    const reason = error instanceof Error ? error.message : String(error);
    this.logger.warn(
      `Error al marcar registro => sequenceNumber: ${sequenceNumber} | reason: ${reason}`,
    );
    return classifyBatchFailure(sequenceNumber, error);
  }
}
