import { Injectable } from '@nestjs/common';
import { SqsHandlerEvent } from '../../../common/middleware/types/lambda-event.types';
import { DispatchBatchUseCase } from '../../application/use-cases/webhook-dispatcher.usecase';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class WebhookDispatcherController {
  constructor(private readonly useCase: DispatchBatchUseCase) {}

  @HandleExecution('WebhookDispatcher')
  async handle(event: SqsHandlerEvent): Promise<ProcessRecordResult[]> {
    return this.useCase.executeBatch(event.parsed.records);
  }
}
