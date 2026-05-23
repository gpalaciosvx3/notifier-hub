import { Injectable, Logger } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { DispatchService } from '../../domain/service/dispatch.service';
import { WebhookEventSchema } from '../dtos/webhook-event.request.dto';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import {
  executeChunkedBatch,
  classifyBatchFailure,
  summarizeBatchResults,
} from '../../../common/helpers/batch-processing.helper';
import { WebhookDispatcherConstants } from '../../infrastructure/constants/webhook-dispatcher.constants';

@Injectable()
export class DispatchBatchUseCase {
  private readonly logger = new Logger(DispatchBatchUseCase.name);

  constructor(private readonly dispatchService: DispatchService) {}

  async executeBatch(records: SqsMessage[]): Promise<ProcessRecordResult[]> {
    this.logger.log(`Lote recibido => total: ${records.length}`);
    const results = await executeChunkedBatch(
      records,
      WebhookDispatcherConstants.MAX_RETRIES,
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
    const result = WebhookEventSchema.safeParse(record.body);
    if (!result.success)
      throw new ValidationException(
        ErrorDictionary.VALIDATION_ERROR,
        result.error.issues as ZodIssue[],
      );
    const event = result.data;
    this.logger.log(
      `Evento validado => notificationId: ${event.notificationId} | callbackUrl: ${event.callbackUrl}`,
    );
    await this.dispatchService.dispatch(event);
    this.logger.log(`Resultado => notificationId: ${event.notificationId} | dispatched`);
  }

  private classifyFailure(sequenceNumber: string, error: unknown): ProcessRecordResult {
    const reason = error instanceof Error ? error.message : String(error);
    this.logger.warn(
      `Error al procesar registro => sequenceNumber: ${sequenceNumber} | reason: ${reason}`,
    );
    return classifyBatchFailure(sequenceNumber, error);
  }
}
