import { Injectable, Logger } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { NotificationService } from '../../domain/service/notification.service';
import { EnqueueNotificationSchema } from '../dtos/enqueue-notification.request.dto';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class EnqueueNotificationUseCase {
  private readonly logger = new Logger(EnqueueNotificationUseCase.name);

  constructor(private readonly service: NotificationService) {}

  async execute(raw: unknown): Promise<string> {
    this.logger.log(`Body recibido: ${JSON.stringify(raw)}`);
    const result = EnqueueNotificationSchema.safeParse(raw);
    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues as ZodIssue[]);

    const dto = result.data;
    this.logger.log(`DTO validado => channel: ${dto.channel} | to: ${dto.to}`);

    const notificationId = await this.service.enqueue(dto);

    this.logger.log(`Resultado => notificationId: ${notificationId} | channel: ${dto.channel}`);
    return notificationId;
  }
}
