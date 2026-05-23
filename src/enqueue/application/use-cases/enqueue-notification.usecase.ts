import { Injectable, Logger } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { EnqueueNotificationService } from '../../domain/service/enqueue-notification.service';
import { TemplateDbRepository } from '../../domain/repository/template.db.repository';
import { TemplateRenderService } from '../../domain/service/template-render.service';
import {
  EnqueueNotificationSchema,
  isTemplateRequest,
} from '../dtos/enqueue-notification.request.dto';
import { ValidationException, CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class EnqueueNotificationUseCase {
  private readonly logger = new Logger(EnqueueNotificationUseCase.name);

  constructor(
    private readonly service: EnqueueNotificationService,
    private readonly templateRepository: TemplateDbRepository,
    private readonly templateRenderService: TemplateRenderService,
  ) {}

  async execute(raw: unknown): Promise<string> {
    this.logger.log(`Body recibido: ${JSON.stringify(raw)}`);
    const result = EnqueueNotificationSchema.safeParse(raw);
    if (!result.success)
      throw new ValidationException(
        ErrorDictionary.VALIDATION_ERROR,
        result.error.issues as ZodIssue[],
      );

    const dto = result.data;

    if (isTemplateRequest(dto)) {
      this.logger.log(`Modo template => templateId: ${dto.templateId} | to: ${dto.to}`);

      const template = await this.templateRepository.findActiveByTemplateId(dto.templateId);
      if (!template) throw new CustomException(ErrorDictionary.TEMPLATE_NOT_FOUND);

      this.logger.log(
        `Template resuelto => templateId: ${template.templateId} | version: ${template.version}`,
      );

      const input = this.templateRenderService.buildInput(
        template,
        dto.to,
        dto.variables ?? {},
        dto.callbackUrl,
      );
      const notificationId = await this.service.enqueue({ ...input, scheduledAt: dto.scheduledAt });
      this.logger.log(
        `Resultado => notificationId: ${notificationId} | templateId: ${template.templateId}`,
      );
      return notificationId;
    }

    this.logger.log(`Modo inline => channel: ${dto.channel} | to: ${dto.to}`);
    const notificationId = await this.service.enqueue(dto);
    this.logger.log(`Resultado => notificationId: ${notificationId} | channel: ${dto.channel}`);
    return notificationId;
  }
}
