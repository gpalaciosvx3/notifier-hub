import { Injectable, Logger } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationSqsRepository } from '../../domain/repository/notification.sqs.repository';
import { NotificationService } from '../../domain/service/notification.service';
import { BuildNotificationCommand } from '../../domain/commands/build-notification.command';
import { EnqueueNotificationSchema } from '../dtos/enqueue-notification.request.dto';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class EnqueueNotificationUseCase {
  private readonly logger = new Logger(EnqueueNotificationUseCase.name);

  constructor(
    private readonly service: NotificationService,
    private readonly dbRepository: NotificationDbRepository,
    private readonly sqsRepository: NotificationSqsRepository,
  ) {}

  async execute(raw: unknown): Promise<string> {
    const result = EnqueueNotificationSchema.safeParse(raw);
    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues as ZodIssue[]);
    const dto = result.data;
    const command = new BuildNotificationCommand(dto.channel, dto.to, dto.body, dto.provider, dto.subject);
    this.logger.log(`Construyendo notificación: ${JSON.stringify(command)}`);
    const notification = this.service.build(command);
    await this.dbRepository.create(notification);
    await this.sqsRepository.enqueue(notification);
    this.logger.log(`Notificación encolada con ID: ${notification.notificationId}`);
    return notification.notificationId;
  }
}
