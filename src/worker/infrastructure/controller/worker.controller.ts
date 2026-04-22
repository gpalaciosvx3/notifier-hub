import { Injectable } from '@nestjs/common';
import { SQSBatchResponse } from 'aws-lambda';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { ProcessBatchUseCase } from '../../application/use-cases/process-batch.usecase';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class WorkerController {
  constructor(private readonly useCase: ProcessBatchUseCase) {}

  @HandleExecution('WORKER')
  handle(event: SqsExtracted): Promise<SQSBatchResponse> {
    return this.useCase.execute(event.records);
  }
}
