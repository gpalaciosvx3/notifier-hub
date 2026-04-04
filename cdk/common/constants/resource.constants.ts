export class ResourceConstants {
  static readonly TABLE_NAME            = 'notifications';
  static readonly TABLE_STATUS_INDEX    = 'status-index';
  static readonly QUEUE_NAME            = 'notifications-queue';
  static readonly DLQ_NAME              = 'notifications-dlq';
  static readonly LAMBDA_ENQUEUE        = 'notifier-hub-enqueue';
  static readonly LAMBDA_QUERY          = 'notifier-hub-query';
  static readonly LAMBDA_WORKER         = 'notifier-hub-worker';
  static readonly LAMBDA_DLQ_PROCESSOR  = 'notifier-hub-dlq';
  static readonly API_NAME              = 'notifier-hub-api';
}
