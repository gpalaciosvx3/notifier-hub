export class EnvConstants {
  static readonly NOTIFICATIONS_TABLE = 'NOTIFICATIONS_TABLE';
  static readonly TEMPLATES_TABLE = 'TEMPLATES_TABLE';
  static readonly NOTIFICATIONS_QUEUE_URL = 'NOTIFICATIONS_QUEUE_URL';
  static readonly WEBHOOKS_QUEUE_URL = 'WEBHOOKS_QUEUE_URL';
  static readonly OUTBOX_TABLE = 'OUTBOX_TABLE';
  static readonly SES_SOURCE_EMAIL = 'SES_SOURCE_EMAIL';
  static readonly AWS_REGION = 'AWS_REGION';
  static readonly EMAIL_DEFAULT_PROVIDER = 'EMAIL_DEFAULT_PROVIDER';
  static readonly SMS_DEFAULT_PROVIDER = 'SMS_DEFAULT_PROVIDER';

  static readonly REQUERIDAS_QUERY: readonly string[] = [EnvConstants.NOTIFICATIONS_TABLE];
  static readonly REQUERIDAS_DLQ: readonly string[] = [
    EnvConstants.NOTIFICATIONS_TABLE,
    EnvConstants.OUTBOX_TABLE,
  ];
  static readonly REQUERIDAS_WORKER: readonly string[] = [
    EnvConstants.NOTIFICATIONS_TABLE,
    EnvConstants.OUTBOX_TABLE,
    EnvConstants.SES_SOURCE_EMAIL,
  ];
  static readonly REQUERIDAS_ENQUEUE: readonly string[] = [
    EnvConstants.NOTIFICATIONS_TABLE,
    EnvConstants.TEMPLATES_TABLE,
    EnvConstants.OUTBOX_TABLE,
    EnvConstants.SES_SOURCE_EMAIL,
  ];
  static readonly REQUERIDAS_RELAY: readonly string[] = [
    EnvConstants.OUTBOX_TABLE,
    EnvConstants.NOTIFICATIONS_QUEUE_URL,
    EnvConstants.WEBHOOKS_QUEUE_URL,
  ];
  static readonly REQUERIDAS_WEBHOOK_DISPATCHER: readonly string[] = [
    EnvConstants.NOTIFICATIONS_TABLE,
  ];
}
