import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { TemplateDbRepository } from '../repository/template.db.repository';
import { TemplateRenderService } from './template-render.service';
import { NotificationInput } from '../types/notification-input.types';
import { EnqueueRequest, isTemplateEnqueueRequest } from '../types/enqueue-request.types';
import { EnqueuePayloadMapper } from '../mapper/enqueue-payload.mapper';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class EnqueueNotificationService {
  private readonly logger = new Logger(EnqueueNotificationService.name);
  private readonly defaultProviderByChannel: Record<NotificationChannel, NotificationProvider>;

  constructor(
    defaultEmailProvider: NotificationProvider,
    defaultSmsProvider: NotificationProvider,
    private readonly dbRepository: NotificationDbRepository,
    private readonly templateRepository: TemplateDbRepository,
    private readonly templateRenderService: TemplateRenderService,
  ) {
    this.defaultProviderByChannel = {
      [NotificationChannel.EMAIL]: defaultEmailProvider,
      [NotificationChannel.SMS]: defaultSmsProvider,
    };
  }

  async enqueue(request: EnqueueRequest, idempotencyKey: string): Promise<string> {
    this.logger.log(`[PASO 1] Verificando idempotencia => idempotencyKey: ${idempotencyKey}`);
    const cached = await this.dbRepository.findNotificationIdByIdempotencyKey(idempotencyKey);
    if (cached) return cached;

    if (isTemplateEnqueueRequest(request)) {
      this.logger.log(
        `[PASO 2] Resolviendo template => templateId: ${request.templateId} | to: ${request.to}`,
      );
      const template = await this.templateRepository.findActiveByTemplateId(request.templateId);
      if (!template) throw new CustomException(ErrorDictionary.TEMPLATE_NOT_FOUND);
      this.logger.log(
        `[PASO 3] Template resuelto => templateId: ${template.templateId} | version: ${template.version}`,
      );
      const resolvedInput = this.templateRenderService.buildInput(
        template,
        request.to,
        request.variables ?? {},
        request.callbackUrl,
      );
      return this.persistWithOutbox({ ...resolvedInput, scheduledAt: request.scheduledAt, idempotencyKey });
    }

    this.logger.log(
      `[PASO 2] Construyendo entidades => channel: ${request.channel} | to: ${request.to}`,
    );
    return this.persistWithOutbox({ ...request, idempotencyKey });
  }

  private async persistWithOutbox(input: NotificationInput): Promise<string> {
    const provider = input.provider ?? this.defaultProviderByChannel[input.channel];
    const { notification, outboxEvent } = EnqueuePayloadMapper.fromInput(input, provider);
    this.logger.log(
      `Persistiendo notificación + evento de outbox atómicamente => notificationId: ${notification.notificationId} | eventId: ${outboxEvent.eventId}`,
    );
    await this.dbRepository.createWithOutboxEvent(notification, outboxEvent, input.idempotencyKey);
    return notification.notificationId;
  }

  build(input: NotificationInput): NotificationEntity {
    const provider = input.provider ?? this.defaultProviderByChannel[input.channel];
    return EnqueuePayloadMapper.fromInput(input, provider).notification;
  }
}
