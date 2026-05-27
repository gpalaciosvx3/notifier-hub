import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../common/constants/resource.constants';

export class WebhookDeadLetterQueueConstruct extends Construct {
  readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.queue = new sqs.Queue(this, 'Queue', {
      queueName: ResourceConstants.WEBHOOKS_DLQ_NAME,
      retentionPeriod: cdk.Duration.days(InfraConstants.SQS_DLQ_RETENTION_DAYS),
    });
  }
}
