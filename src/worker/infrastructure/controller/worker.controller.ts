import { Injectable } from '@nestjs/common';
import { SQSBatchResponse } from 'aws-lambda';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { ProcessBatchUseCase } from '../../application/use-cases/process-batch.usecase';

@Injectable()
export class WorkerController {
  constructor(private readonly useCase: ProcessBatchUseCase) {}

  handle(event: SqsExtracted): Promise<SQSBatchResponse> {
    return this.useCase.execute(event.records);
  }
}
