import { Injectable } from '@nestjs/common';
import { SQSBatchResponse } from 'aws-lambda';
import { WorkerRecord } from '../parsers/sqs.parser';
import { ProcessingService } from '../../domain/service/processing.service';

@Injectable()
export class ProcessBatchUseCase {
  constructor(private readonly processingService: ProcessingService) {}

  async execute(records: WorkerRecord[]): Promise<SQSBatchResponse> {
    const results = await Promise.all(records.map(r => this.processRecord(r)));
    return { batchItemFailures: results.filter(Boolean) as { itemIdentifier: string }[] };
  }

  private async processRecord(record: WorkerRecord): Promise<{ itemIdentifier: string } | null> {
    try {
      await this.processingService.process(record.notification);
      return null;
    } catch (error) {
      const handled = await this.processingService.handleFault(record.notification, error);
      return handled ? null : { itemIdentifier: record.messageId };
    }
  }
}
