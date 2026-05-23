import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface WebhooksQueueProps {
  webhookDlq: sqs.Queue;
}

export class WebhooksQueueConstruct extends Construct {
  readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: WebhooksQueueProps) {
    super(scope, id);

    this.queue = new sqs.Queue(this, 'Queue', {
      queueName: ResourceConstants.WEBHOOKS_QUEUE_NAME,
      visibilityTimeout: cdk.Duration.seconds(InfraConstants.SQS_VISIBILITY_TIMEOUT_SECONDS),
      deadLetterQueue: {
        queue: props.webhookDlq,
        maxReceiveCount: InfraConstants.SQS_MAX_RECEIVE_COUNT,
      },
    });
  }
}
