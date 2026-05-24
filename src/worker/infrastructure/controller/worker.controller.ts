import { Injectable } from '@nestjs/common';
import { SqsHandlerEvent } from '../../../common/middleware/types/lambda-event.types';
import { ProcessBatchUseCase } from '../../application/use-cases/worker.usecase';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class WorkerController {
  constructor(private readonly useCase: ProcessBatchUseCase) {}

  @HandleExecution('WorkerSender')
  async handle(event: SqsHandlerEvent): Promise<ProcessRecordResult[]> {
    return this.useCase.executeBatch(event.parsed.records);
  }
}
