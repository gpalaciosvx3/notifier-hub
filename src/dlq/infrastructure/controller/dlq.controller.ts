import { Injectable, Logger } from '@nestjs/common';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { MarkBatchFailedPermanentUseCase } from '../../application/use-cases/mark-batch-failed-permanent.usecase';

@Injectable()
export class DlqController {
  private readonly logger = new Logger(DlqController.name);

  constructor(private readonly useCase: MarkBatchFailedPermanentUseCase) {}

  async handle(event: SqsExtracted): Promise<void> {
    try {
      await this.useCase.execute(event.records);
    } catch (error) {
      this.logger.error('Error procesando DLQ batch', error);
      throw error;
    }
  }
}
