import { NotificationInput } from '../types/notification-input.types';
import { TemplateRecord } from '../types/template-record.types';

export class NotificationInputMapper {
  static fromTemplate(
    template: TemplateRecord,
    to: string,
    renderedSubject: string | undefined,
    renderedBody: string,
    callbackUrl: string,
  ): NotificationInput {
    return {
      channel: template.channel,
      provider: template.provider,
      to,
      subject: renderedSubject || undefined,
      body: renderedBody,
      templateId: template.templateId,
      templateVersion: template.version,
      callbackUrl,
    };
  }
}
