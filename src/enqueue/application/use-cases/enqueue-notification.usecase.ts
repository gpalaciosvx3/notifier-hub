import { Injectable, Logger } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { EnqueueNotificationService } from '../../domain/service/enqueue-notification.service';
import { EnqueueNotificationSchema } from '../dtos/enqueue-notification.request.dto';
import { EnqueueRequest } from '../../domain/types/enqueue-request.types';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class EnqueueNotificationUseCase {
  private readonly logger = new Logger(EnqueueNotificationUseCase.name);

  constructor(private readonly service: EnqueueNotificationService) {}

  async execute(raw: unknown, idempotencyKey?: string): Promise<string> {
    this.logger.log(`Body recibido: ${JSON.stringify(raw)}`);
    const result = EnqueueNotificationSchema.safeParse(raw);
    if (!result.success)
      throw new ValidationException(
        ErrorDictionary.VALIDATION_ERROR,
        result.error.issues as ZodIssue[],
      );

    const notificationId = await this.service.enqueue(result.data as EnqueueRequest, idempotencyKey);
    this.logger.log(`Resultado => notificationId: ${notificationId}`);
    return notificationId;
  }
}
