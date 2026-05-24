import { z } from 'zod';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { Email } from '../../../common/value-objects/email.vo';
import { PhoneNumber } from '../../../common/value-objects/phone-number.vo';

type ReglaCanalConfig = {
  validarDestinatario: (to: string) => boolean;
  errorDestinatario: string;
  requiereSubject: boolean;
  proveedoresValidos: NotificationProvider[];
};

const REGLAS_POR_CANAL: Record<NotificationChannel, ReglaCanalConfig> = {
  [NotificationChannel.EMAIL]: {
    validarDestinatario: Email.isValid.bind(Email),
    errorDestinatario: 'Dirección de correo inválida',
    requiereSubject: true,
    proveedoresValidos: [NotificationProvider.SES],
  },
  [NotificationChannel.SMS]: {
    validarDestinatario: PhoneNumber.isValid.bind(PhoneNumber),
    errorDestinatario: 'Número de teléfono inválido (formato E.164 requerido)',
    requiereSubject: false,
    proveedoresValidos: [NotificationProvider.SNS],
  },
};

const scheduledAtField = z
  .string()
  .datetime({ offset: true })
  .refine((val) => new Date(val) > new Date(), {
    message: 'La fecha programada debe ser una fecha futura',
  })
  .optional();

const InlineSchema = z
  .object({
    channel: z.nativeEnum(NotificationChannel),
    provider: z.nativeEnum(NotificationProvider).optional(),
    to: z.string().min(1),
    subject: z.string().optional(),
    body: z.string().min(1),
    callbackUrl: z.string().url(),
    scheduledAt: scheduledAtField,
  })
  .superRefine((data, ctx) => {
    const config = REGLAS_POR_CANAL[data.channel];
    const reglas: Array<[boolean, { path: string[]; message: string }]> = [
      [!config.validarDestinatario(data.to), { path: ['to'], message: config.errorDestinatario }],
      [
        config.requiereSubject && !data.subject,
        { path: ['subject'], message: 'El asunto es requerido para notificaciones de correo' },
      ],
      [
        !!data.provider && !config.proveedoresValidos.includes(data.provider),
        { path: ['provider'], message: 'Proveedor incompatible con el canal especificado' },
      ],
    ];
    reglas
      .filter(([fallo]) => fallo)
      .forEach(([, issue]) => ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue }));
  });

const TemplateSchema = z.object({
  templateId: z.string().min(1),
  to: z.string().min(1),
  variables: z.record(z.unknown()).optional(),
  callbackUrl: z.string().url(),
  scheduledAt: scheduledAtField,
});

export const EnqueueNotificationSchema = z.union([InlineSchema, TemplateSchema]);
