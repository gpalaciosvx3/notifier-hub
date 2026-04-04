export class InfraConstants {
  static readonly SQS_VISIBILITY_TIMEOUT_SECONDS = 120;
  static readonly SQS_MAX_RECEIVE_COUNT          = 3;
  static readonly SQS_DLQ_RETENTION_DAYS         = 14;
  static readonly SQS_BATCH_SIZE                 = 10;

  static readonly LAMBDA_TIMEOUT_DEFAULT_SECONDS = 30;
  static readonly LAMBDA_TIMEOUT_WORKER_SECONDS  = 60;
  static readonly LAMBDA_MEMORY_DEFAULT_MB       = 256;
  static readonly LAMBDA_MEMORY_WORKER_MB        = 512;
}
