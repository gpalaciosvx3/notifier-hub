import { Injectable } from '@nestjs/common';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { MarkBatchFailedPermanentUseCase } from '../../application/use-cases/mark-batch-failed-permanent.usecase';

@Injectable()
export class DlqController {
  constructor(private readonly useCase: MarkBatchFailedPermanentUseCase) {}

  handle(event: SqsExtracted): Promise<void> {
    return this.useCase.execute(event.records);
  }
}
