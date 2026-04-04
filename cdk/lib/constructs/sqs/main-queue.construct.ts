import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface MainQueueProps {
  dlq: sqs.Queue;
}

export class MainQueueConstruct extends Construct {
  readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: MainQueueProps) {
    super(scope, id);

    this.queue = new sqs.Queue(this, 'Queue', {
      queueName: ResourceConstants.QUEUE_NAME,
      visibilityTimeout: cdk.Duration.seconds(InfraConstants.SQS_VISIBILITY_TIMEOUT_SECONDS),
      deadLetterQueue: {
        queue: props.dlq,
        maxReceiveCount: InfraConstants.SQS_MAX_RECEIVE_COUNT,
      },
    });
  }
}
