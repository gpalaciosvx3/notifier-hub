import { NamingConstants } from './naming.constants';

export class ResourceConstants {
  static readonly TABLE_NAME            = NamingConstants.TBL_001;
  static readonly TABLE_STATUS_INDEX    = 'status-index';
  static readonly TABLE_TO_INDEX        = 'to-index';
  static readonly QUEUE_NAME            = NamingConstants.SQS_001;
  static readonly DLQ_NAME              = NamingConstants.SQS_002;
  static readonly LAMBDA_ENQUEUE        = NamingConstants.LMB_001;
  static readonly LAMBDA_QUERY          = NamingConstants.LMB_002;
  static readonly LAMBDA_WORKER         = NamingConstants.LMB_003;
  static readonly LAMBDA_DLQ_PROCESSOR  = NamingConstants.LMB_004;
  static readonly API_NAME              = NamingConstants.APG_001;
  static readonly WORKER_ROLE           = NamingConstants.ROL_001;
}
