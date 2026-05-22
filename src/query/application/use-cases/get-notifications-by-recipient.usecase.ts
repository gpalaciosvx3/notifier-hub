import { Injectable, Logger } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { QueryService } from '../../domain/service/query.service';
import { QueryByRecipientRawSchema } from '../dtos/query-by-recipient.request.dto';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { NotificationSummary, PagedResult } from '../../domain/types/query-output.types';

@Injectable()
export class GetNotificationsByRecipientUseCase {
  private readonly logger = new Logger(GetNotificationsByRecipientUseCase.name);

  constructor(private readonly service: QueryService) {}

  execute(raw: unknown): Promise<PagedResult<NotificationSummary>> {
    this.logger.log(`Body recibido: ${JSON.stringify(raw)}`);
    const result = QueryByRecipientRawSchema.safeParse(raw);
    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues as ZodIssue[]);
    this.logger.log(`Consulta por destinatario => to: ${result.data.to}`);
    return this.service.searchByRecipient(result.data.to, result.data.pageToken);
  }
}
