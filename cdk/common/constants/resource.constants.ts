import { NamingConstants } from './naming.constants';

export class ResourceConstants {
  static readonly TEMPLATES_CHANNEL_INDEX = 'channel-index';
  static readonly TABLE_STATUS_INDEX = 'status-index';
  static readonly TABLE_TO_INDEX = 'to-index';

  static readonly TABLE_NAME = NamingConstants.TBL_001;
  static readonly OUTBOX_TABLE_NAME = NamingConstants.TBL_002;
  static readonly TEMPLATES_TABLE_NAME = NamingConstants.TBL_003;

  static readonly QUEUE_NAME = NamingConstants.SQS_001;
  static readonly WEBHOOKS_QUEUE_NAME = NamingConstants.SQS_002;
  static readonly DLQ_NAME = NamingConstants.SQS_003;
  static readonly WEBHOOKS_DLQ_NAME = NamingConstants.SQS_004;

  static readonly LAMBDA_ENQUEUE = NamingConstants.LMB_001;
  static readonly LAMBDA_QUERY = NamingConstants.LMB_002;
  static readonly LAMBDA_RELAY = NamingConstants.LMB_003;
  static readonly LAMBDA_WORKER = NamingConstants.LMB_004;
  static readonly LAMBDA_WEBHOOK_DISPATCHER = NamingConstants.LMB_005;
  static readonly LAMBDA_DLQ_PROCESSOR = NamingConstants.LMB_006;

  static readonly API_NAME = NamingConstants.APG_001;

  static readonly WORKER_ROLE = NamingConstants.ROL_001;

  static readonly ALARM_NOTIFICATION_DLQ = NamingConstants.CWA_001;
  static readonly ALARM_WEBHOOK_DLQ = NamingConstants.CWA_002;
}
