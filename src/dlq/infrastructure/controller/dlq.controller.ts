import { Injectable } from '@nestjs/common';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { MarkBatchFailedPermanentUseCase } from '../../application/use-cases/mark-batch-failed-permanent.usecase';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class DlqController {
  constructor(private readonly useCase: MarkBatchFailedPermanentUseCase) {}

  @HandleExecution('DlqNotification')
  handle(event: SqsExtracted): Promise<void> {
    return this.useCase.executeBatch(event.records);
  }
}

