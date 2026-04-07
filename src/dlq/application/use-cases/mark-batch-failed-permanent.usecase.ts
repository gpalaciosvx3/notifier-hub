import { Injectable, Logger } from '@nestjs/common';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { DlqBatchService } from '../../domain/service/dlq-batch.service';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class MarkBatchFailedPermanentUseCase {
  private readonly logger = new Logger(MarkBatchFailedPermanentUseCase.name);

  constructor(private readonly dlqBatchService: DlqBatchService) {}

  async execute(records: SqsMessage[]): Promise<void> {
    const result = await this.dlqBatchService.markAllFailed(records);
    this.logger.log(`Resultado => Total: ${result.total} | Actualizados: ${result.updated} | No encontrados: ${result.notFound} | Fallidos: ${result.failed}`);

    if (result.failed > 0) {
      throw new CustomException(ErrorDictionary.DLQ_BATCH_INFRA_ERROR, `${result.failed} de ${result.total} registros fallaron`);
    }
  }
}
