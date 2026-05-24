import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NotificationsTableConstruct } from './constructs/dynamodb/notifications-table.construct';
import { TemplatesTableConstruct } from './constructs/dynamodb/templates-table.construct';
import { OutboxTableConstruct } from './constructs/dynamodb/outbox-table.construct';
import { DeadLetterQueueConstruct } from './constructs/sqs/dead-letter-queue.construct';
import { MainQueueConstruct } from './constructs/sqs/main-queue.construct';
import { WebhooksQueueConstruct } from './constructs/sqs/webhooks-queue.construct';
import { WebhookDeadLetterQueueConstruct } from './constructs/sqs/webhook-dead-letter-queue.construct';
import { EnqueueFnConstruct } from './constructs/lambda/enqueue/enqueue-fn.construct';
import { QueryFnConstruct } from './constructs/lambda/query/query-fn.construct';
import { SenderFnConstruct } from './constructs/lambda/sender/sender-fn.construct';
import { DlqProcessorFnConstruct } from './constructs/lambda/dlq-processor/dlq-processor-fn.construct';
import { RelayFnConstruct } from './constructs/lambda/relay/relay-fn.construct';
import { WebhookDispatcherFnConstruct } from './constructs/lambda/webhook-dispatcher/webhook-dispatcher-fn.construct';
import { HttpApiConstruct } from './constructs/api-gateway/http-api.construct';
import { NotificationDlqAlarmConstruct } from './constructs/cloudwatch/notification-dlq-alarm.construct';
import { WebhookDlqAlarmConstruct } from './constructs/cloudwatch/webhook-dlq-alarm.construct';

interface NotifierHubStackProps extends cdk.StackProps {
  sesSourceEmail: string;
}

export class NotifierHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NotifierHubStackProps) {
    super(scope, id, props);

    const notifications = new NotificationsTableConstruct(this, 'NotificationsTable');
    const templates = new TemplatesTableConstruct(this, 'TemplatesTable');
    const outbox = new OutboxTableConstruct(this, 'OutboxTable');
    const dlq = new DeadLetterQueueConstruct(this, 'DeadLetterQueue');
    const queue = new MainQueueConstruct(this, 'MainQueue', { dlq: dlq.queue });
    const webhookDlq = new WebhookDeadLetterQueueConstruct(this, 'WebhookDeadLetterQueue');
    const webhooksQueue = new WebhooksQueueConstruct(this, 'WebhooksQueue', {
      webhookDlq: webhookDlq.queue,
    });

    const enqueueFn = new EnqueueFnConstruct(this, 'EnqueueFn', {
      table: notifications.table,
      outboxTable: outbox.table,
      sesSourceEmail: props.sesSourceEmail,
    });

    const queryFn = new QueryFnConstruct(this, 'QueryFn', { table: notifications.table });

    new SenderFnConstruct(this, 'WorkerFn', {
      table: notifications.table,
      outboxTable: outbox.table,
      queue: queue.queue,
      sesSourceEmail: props.sesSourceEmail,
    });

    new DlqProcessorFnConstruct(this, 'DlqProcessorFn', {
      table: notifications.table,
      outboxTable: outbox.table,
      dlq: dlq.queue,
      webhookDlq: webhookDlq.queue,
    });

    new NotificationDlqAlarmConstruct(this, 'NotificationDlqAlarm', { queue: dlq.queue });
    new WebhookDlqAlarmConstruct(this, 'WebhookDlqAlarm', { queue: webhookDlq.queue });

    new RelayFnConstruct(this, 'RelayFn', {
      outboxTable: outbox.table,
      notificationsTable: notifications.table,
      notificationsQueue: queue.queue,
      webhooksQueue: webhooksQueue.queue,
    });

    new WebhookDispatcherFnConstruct(this, 'WebhookDispatcherFn', {
      table: notifications.table,
      webhooksQueue: webhooksQueue.queue,
    });

    const api = new HttpApiConstruct(this, 'HttpApi', {
      enqueueFn: enqueueFn.fn,
      queryFn: queryFn.fn,
    });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url, description: 'API Gateway URL' });
    new cdk.CfnOutput(this, 'QueueUrl', {
      value: queue.queue.queueUrl,
      description: 'Main SQS Queue URL',
    });
    new cdk.CfnOutput(this, 'DlqUrl', {
      value: dlq.queue.queueUrl,
      description: 'Dead Letter Queue URL',
    });
    new cdk.CfnOutput(this, 'WebhooksQueueUrl', {
      value: webhooksQueue.queue.queueUrl,
      description: 'Webhooks Queue URL',
    });
    new cdk.CfnOutput(this, 'WebhooksDlqUrl', {
      value: webhookDlq.queue.queueUrl,
      description: 'Webhooks Dead Letter Queue URL',
    });
    new cdk.CfnOutput(this, 'OutboxTableName', {
      value: outbox.table.tableName,
      description: 'Outbox Table Name',
    });
    new cdk.CfnOutput(this, 'TemplatesTableName', {
      value: templates.table.tableName,
      description: 'Templates Table Name',
    });
  }
}
