import { Injectable } from '@nestjs/common';
import { SQSBatchResponse } from 'aws-lambda';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { ProcessBatchUseCase } from '../../application/use-cases/process-batch.usecase';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class WorkerController {
  constructor(private readonly useCase: ProcessBatchUseCase) {}

  @HandleExecution('WORKER')
  async handle(event: SqsExtracted): Promise<SQSBatchResponse> {
    const results = await this.useCase.executeBatch(event.records);
    return { batchItemFailures: results.filter(r => r.retry).map(r => ({ itemIdentifier: r.sequenceNumber })) };
  }
}

