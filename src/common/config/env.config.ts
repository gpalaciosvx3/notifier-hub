import { EnvConstants } from '../constants/env.constants';
import { NotificationProvider } from '../constants/notification-provider.constants';

export const envConfig = {
  notificationsTable: process.env[EnvConstants.NOTIFICATIONS_TABLE] as string,
  templatesTable: process.env[EnvConstants.TEMPLATES_TABLE] as string,
  outboxTable: process.env[EnvConstants.OUTBOX_TABLE] as string,
  notificationsQueueUrl: process.env[EnvConstants.NOTIFICATIONS_QUEUE_URL] as string,
  webhooksQueueUrl: process.env[EnvConstants.WEBHOOKS_QUEUE_URL] as string,
  sesSourceEmail: process.env[EnvConstants.SES_SOURCE_EMAIL] as string,
  awsRegion: process.env[EnvConstants.AWS_REGION] ?? 'us-east-1',
  defaultEmailProvider: process.env[EnvConstants.EMAIL_DEFAULT_PROVIDER] ?? NotificationProvider.SES,
  defaultSmsProvider: process.env[EnvConstants.SMS_DEFAULT_PROVIDER] ?? NotificationProvider.SNS,
};
