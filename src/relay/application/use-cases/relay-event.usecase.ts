import { Injectable, Logger } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { DynamoStreamRecord } from '../../../common/middleware/types/lambda-event.types';
import { OutboxEventRecordSchema } from '../dtos/relay-event.request.dto';
import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';
import { RelayService } from '../../domain/service/relay.service';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { executeChunkedBatch, classifyBatchFailure, summarizeBatchResults } from '../../../common/helpers/batch-processing.helper';
import { RelayConstants } from '../constants/relay.constants';

@Injectable()
export class RelayEventUseCase {
  private readonly logger = new Logger(RelayEventUseCase.name);

  constructor(private readonly relayService: RelayService) {}

  async executeBatch(records: DynamoStreamRecord[]): Promise<ProcessRecordResult[]> {
    this.logger.log(`Lote recibido => total: ${records.length}`);
    const results = await executeChunkedBatch(
      records,
      RelayConstants.DYNAMO_STREAM_CHUNK_SIZE,
      record => this.executeOne(record),
      (sequenceNumber, error) => this.classifyFailure(sequenceNumber, error),
    );
    const summary = summarizeBatchResults(results);
    this.logger.log(`Resultado batch => total: ${summary.total} | success: ${summary.success} | discarded: ${summary.discarded} | retryable: ${summary.retryable}`);
    return results;
  }

  private async executeOne(record: DynamoStreamRecord): Promise<void> {
    this.logger.log(`Procesando imagen DDB Stream => sequenceNumber: ${record.sequenceNumber} | eventId: ${String(record.newImage['eventId'] ?? 'unknown')}`);

    const result = OutboxEventRecordSchema.safeParse(record.newImage);
    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues as ZodIssue[]);

    const dto = result.data;

    if (dto.publishedAt) {
      this.logger.log(`Evento ya publicado, ignorando => eventId: ${dto.eventId}`);
      return;
    }

    const event = OutboxEventEntity.fromRecord(dto);
    this.logger.log(`Resultado => eventId: ${dto.eventId} | eventType: ${dto.eventType}`);
    await this.relayService.relay(event);
  }

  private classifyFailure(sequenceNumber: string, error: unknown): ProcessRecordResult {
    const reason = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Error al procesar registro => sequenceNumber: ${sequenceNumber} | reason: ${reason}`);
    return classifyBatchFailure(sequenceNumber, error);
  }
}
