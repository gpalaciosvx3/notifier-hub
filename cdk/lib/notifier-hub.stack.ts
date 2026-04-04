import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StageConfig } from '../common/types/stage-config.types';
import { NotificationsTableConstruct } from './constructs/dynamodb/notifications-table.construct';
import { DeadLetterQueueConstruct } from './constructs/sqs/dead-letter-queue.construct';
import { MainQueueConstruct } from './constructs/sqs/main-queue.construct';
import { EnqueueFnConstruct } from './constructs/lambda/enqueue/enqueue-fn.construct';
import { QueryFnConstruct } from './constructs/lambda/query/query-fn.construct';
import { WorkerFnConstruct } from './constructs/lambda/worker/worker-fn.construct';
import { DlqProcessorFnConstruct } from './constructs/lambda/dlq-processor/dlq-processor-fn.construct';
import { HttpApiConstruct } from './constructs/api-gateway/http-api.construct';

interface NotifierHubStackProps extends cdk.StackProps {
  config: StageConfig;
}

export class NotifierHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NotifierHubStackProps) {
    super(scope, id, props);

    const db     = new NotificationsTableConstruct(this, 'NotificationsTable');
    const dlq    = new DeadLetterQueueConstruct(this, 'DeadLetterQueue');
    const queue  = new MainQueueConstruct(this, 'MainQueue', { dlq: dlq.queue });

    const enqueueFn = new EnqueueFnConstruct(this, 'EnqueueFn', {
      table: db.table,
      queue: queue.queue,
      sesSourceEmail: props.config.sesSourceEmail,
    });

    const queryFn = new QueryFnConstruct(this, 'QueryFn', { table: db.table });

    new WorkerFnConstruct(this, 'WorkerFn', {
      table: db.table,
      queue: queue.queue,
      sesSourceEmail: props.config.sesSourceEmail,
    });

    new DlqProcessorFnConstruct(this, 'DlqProcessorFn', {
      table: db.table,
      dlq: dlq.queue,
    });

    const api = new HttpApiConstruct(this, 'HttpApi', {
      enqueueFn: enqueueFn.fn,
      queryFn: queryFn.fn,
    });

    new cdk.CfnOutput(this, 'ApiUrl',  { value: api.url, description: 'API Gateway URL' });
    new cdk.CfnOutput(this, 'QueueUrl', { value: queue.queue.queueUrl, description: 'Main SQS Queue URL' });
    new cdk.CfnOutput(this, 'DlqUrl',  { value: dlq.queue.queueUrl,   description: 'Dead Letter Queue URL' });
  }
}
