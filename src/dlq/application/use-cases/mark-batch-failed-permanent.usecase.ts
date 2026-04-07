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
    const outcomes = await Promise.allSettled(records.map(r => this.dlqBatchService.markFailed(r)));

    const fulfilled = outcomes.filter((o): o is PromiseFulfilledResult<boolean> => o.status === 'fulfilled');
    const updated = fulfilled.filter(o => o.value).length;
    const notFound = fulfilled.filter(o => !o.value).length;
    const failed = outcomes.filter(o => o.status === 'rejected').length;

    this.logger.log(`Resultado => Total: ${records.length} | Actualizados: ${updated} | No encontrados: ${notFound} | Fallidos: ${failed}`);

    if (failed > 0) {
      throw new CustomException(ErrorDictionary.DLQ_BATCH_INFRA_ERROR, `${failed} de ${records.length} registros fallaron`);
    }
  }
}
