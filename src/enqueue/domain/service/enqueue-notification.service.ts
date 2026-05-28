import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { NotificationDbRepository } from '../repository/enqueue-notification.db.repository';
import { TemplateDbRepository } from '../repository/enqueue-template.db.repository';
import { TemplateRenderService } from './enqueue-template-render.service';
import { NotificationInput } from '../types/enqueue-notification-input.types';
import { EnqueueRequest, isTemplateEnqueueRequest } from '../types/enqueue-request.types';
import { EnqueuePayloadMapper } from '../mapper/enqueue-payload.mapper';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { appLogger } from '../../../common/logger/lambda.logger';
import { appTracer } from '../../../common/tracer/lambda.tracer';
import { appMetrics, MetricUnit } from '../../../common/metrics/lambda.metrics';

@Injectable()
export class EnqueueNotificationService {
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
    appLogger.step(1, 'Verificando idempotencia', { eventId: idempotencyKey });
    const cached = await this.dbRepository.findNotificationIdByIdempotencyKey(idempotencyKey);
    if (cached) return cached;

    if (isTemplateEnqueueRequest(request)) {
      return appTracer.subsegment('templateResolution', async () => {
        appLogger.step(2, 'Resolviendo template', { templateId: request.templateId });
        const template = await this.templateRepository.findActiveByTemplateId(request.templateId);
        if (!template) {
          appMetrics.dimension('gate', 'template-resolution');
          appMetrics.add('notifications_rejected');
          appMetrics.flush();
          appLogger.warn('Template no encontrado — rechazo', {
            gate: 'template-resolution',
            templateId: request.templateId,
          });
          throw new CustomException(ErrorDictionary.TEMPLATE_NOT_FOUND);
        }
        appLogger.step(3, 'Template resuelto', {
          templateId: template.templateId,
          templateVersion: template.version,
        });
        const resolvedInput = this.templateRenderService.buildInput(
          template,
          request.to,
          request.variables ?? {},
          request.callbackUrl,
        );
        return this.persistWithOutbox({
          ...resolvedInput,
          scheduledAt: request.scheduledAt,
          idempotencyKey,
        });
      });
    }

    appLogger.step(2, 'Construyendo entidades', { channel: request.channel });
    return this.persistWithOutbox({ ...request, idempotencyKey });
  }

  private async persistWithOutbox(input: NotificationInput): Promise<string> {
    const provider = input.provider ?? this.defaultProviderByChannel[input.channel];
    const { notification, outboxEvent } = EnqueuePayloadMapper.fromInput(input, provider);

    appTracer.annotate('notificationId', notification.notificationId);

    appLogger.info('Persistiendo notificación + evento de outbox atómicamente', {
      notificationId: notification.notificationId,
      templateId: notification.templateId,
      templateVersion: notification.templateVersion,
      eventId: outboxEvent.eventId,
      eventType: outboxEvent.eventType,
    });

    await appTracer.subsegment('persistWithOutbox', () =>
      this.dbRepository.createWithOutboxEvent(notification, outboxEvent, input.idempotencyKey),
    );

    appMetrics.add('notifications_accepted');

    return notification.notificationId;
  }
}
