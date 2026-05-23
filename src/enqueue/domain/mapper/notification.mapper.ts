import { NotificationEntity } from '../../../common/entities/notification.entity';
import { NotificationInput } from '../types/notification-input.types';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';

export class NotificationMapper {
  static fromInput(input: NotificationInput, provider: NotificationProvider): NotificationEntity {
    return NotificationEntity.build({
      channel: input.channel,
      provider,
      to: input.to,
      subject: input.subject,
      body: input.body,
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      callbackUrl: input.callbackUrl,
    });
  }
}
