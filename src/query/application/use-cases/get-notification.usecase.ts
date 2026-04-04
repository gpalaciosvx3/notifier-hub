import { Injectable } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { QueryService } from '../../domain/service/query.service';
import { SearchNotificationCommand } from '../../domain/commands/search-notification.command';
import { QueryRawSchema } from '../dtos/query.request.dto';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class GetNotificationUseCase {
  constructor(private readonly service: QueryService) {}

  execute(raw: unknown): Promise<NotificationEntity | NotificationEntity[]> {
    const result = QueryRawSchema.safeParse(raw);
    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues as ZodIssue[]);
    const command = result.data.id
      ? SearchNotificationCommand.byId(result.data.id)
      : SearchNotificationCommand.byStatus(result.data.status!);
    return this.service.search(command);
  }
}
