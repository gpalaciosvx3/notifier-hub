import { Injectable } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { EnqueueNotificationService } from '../../domain/service/enqueue-notification.service';
import { EnqueueNotificationSchema } from '../dtos/enqueue-notification.request.dto';
import { EnqueueRequest } from '../../domain/types/enqueue-request.types';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { appLogger } from '../../../common/logger/lambda.logger';

@Injectable()
export class EnqueueNotificationUseCase {
  constructor(private readonly service: EnqueueNotificationService) {}

  async execute(raw: unknown, idempotencyKey: string): Promise<string> {
    appLogger.info('Body recibido', { payload: raw });
    const result = EnqueueNotificationSchema.safeParse(raw);
    if (!result.success)
      throw new ValidationException(
        ErrorDictionary.VALIDATION_ERROR,
        result.error.issues as ZodIssue[],
      );

    const notificationId = await this.service.enqueue(
      result.data as EnqueueRequest,
      idempotencyKey,
    );
    appLogger.info('Resultado', { notificationId });
    return notificationId;
  }
}
