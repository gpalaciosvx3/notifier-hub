import { ulid } from 'ulid';
import { CustomException } from '../errors/custom.exception';
import { ErrorDictionary, InputError } from '../errors/error.dictionary';
import { NotificationStatus } from '../constants/notification-status.constants';
import { WebhookStatus } from '../constants/webhook-status.constants';
import { NotificationChannel } from '../constants/notification-channel.constants';
import { NotificationProvider } from '../constants/notification-provider.constants';
import { NotificationConstants } from '../constants/notification.constants';
import { Email } from '../value-objects/email.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';

export class NotificationEntity {
  private static readonly CONFIG_CANAL: Record<
    NotificationChannel,
    {
      validarDestinatario: (to: string) => boolean;
      errorDestinatario: InputError;
      requiereSubject: boolean;
      proveedoresValidos: NotificationProvider[];
    }
  > = {
    [NotificationChannel.EMAIL]: {
      validarDestinatario: Email.isValid.bind(Email),
      errorDestinatario: ErrorDictionary.INVALID_EMAIL,
      requiereSubject: true,
      proveedoresValidos: [NotificationProvider.SES],
    },
    [NotificationChannel.SMS]: {
      validarDestinatario: PhoneNumber.isValid.bind(PhoneNumber),
      errorDestinatario: ErrorDictionary.INVALID_PHONE,
      requiereSubject: false,
      proveedoresValidos: [NotificationProvider.SNS],
    },
  };

  private constructor(
    public readonly notificationId: string,
    public readonly channel: NotificationChannel,
    public readonly provider: NotificationProvider,
    public readonly to: string,
    public readonly body: string,
    public readonly status: NotificationStatus,
    public readonly webhookStatus: WebhookStatus,
    public readonly ttl: number,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly callbackUrl: string,
    public readonly subject?: string,
    public readonly failureReason?: string,
    public readonly templateId?: string,
    public readonly templateVersion?: number,
  ) {}

  static build(params: {
    channel: NotificationChannel;
    provider: NotificationProvider;
    to: string;
    body: string;
    subject?: string;
    templateId?: string;
    templateVersion?: number;
    callbackUrl: string;
  }): NotificationEntity {
    NotificationEntity.validateInvariants(params);
    const now = new Date().toISOString();
    return new NotificationEntity(
      ulid(),
      params.channel,
      params.provider,
      params.to,
      params.body,
      NotificationStatus.PENDING,
      WebhookStatus.PENDING,
      Math.floor(Date.now() / 1000) + NotificationConstants.TTL_SECONDS,
      now,
      now,
      params.callbackUrl,
      params.subject,
      undefined,
      params.templateId,
      params.templateVersion,
    );
  }

  private static validateInvariants(params: {
    channel: NotificationChannel;
    provider: NotificationProvider;
    to: string;
    subject?: string;
  }): void {
    const config = NotificationEntity.CONFIG_CANAL[params.channel];
    const reglas: Array<[boolean, InputError]> = [
      [!config.validarDestinatario(params.to), config.errorDestinatario],
      [config.requiereSubject && !params.subject, ErrorDictionary.MISSING_SUBJECT],
      [!config.proveedoresValidos.includes(params.provider), ErrorDictionary.INVALID_PROVIDER],
    ];
    reglas
      .filter(([fallo]) => fallo)
      .slice(0, 1)
      .forEach(([, entrada]) => {
        throw new CustomException(entrada);
      });
  }
}
