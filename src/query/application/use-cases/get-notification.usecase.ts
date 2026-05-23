import { Injectable, Logger } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { QueryService } from '../../domain/service/query.service';
import { QueryRawSchema } from '../dtos/query.request.dto';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class GetNotificationUseCase {
  private readonly logger = new Logger(GetNotificationUseCase.name);

  constructor(private readonly service: QueryService) {}

  async execute(raw: unknown): Promise<NotificationEntity | NotificationEntity[]> {
    this.logger.log(`Body recibido: ${JSON.stringify(raw)}`);
    const result = QueryRawSchema.safeParse(raw);
    if (!result.success)
      throw new ValidationException(
        ErrorDictionary.VALIDATION_ERROR,
        result.error.issues as ZodIssue[],
      );

    this.logger.log(
      `Consulta validada => id: ${result.data.id ?? '-'} | status: ${result.data.status ?? '-'}`,
    );
    const response = await this.service.search(result.data);
    this.logger.log(`Resultado => count: ${Array.isArray(response) ? response.length : 1}`);
    return response;
  }
}
