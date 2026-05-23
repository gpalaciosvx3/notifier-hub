import { Injectable } from '@nestjs/common';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { DispatchBatchUseCase } from '../../application/use-cases/dispatch-batch.usecase';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class WebhookDispatcherController {
  constructor(private readonly useCase: DispatchBatchUseCase) {}

  @HandleExecution('WebhookDispatcher')
  async handle(event: SqsExtracted): Promise<ProcessRecordResult[]> {
    return this.useCase.executeBatch(event.records);
  }
}
