import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { NotificationsTableConstruct } from '../notifier-constructs/dynamodb/notifications-table.construct';
import { TemplatesTableConstruct } from '../notifier-constructs/dynamodb/templates-table.construct';
import { OutboxTableConstruct } from '../notifier-constructs/dynamodb/outbox-table.construct';
import { DeadLetterQueueConstruct } from '../notifier-constructs/sqs/dead-letter-queue.construct';
import { MainQueueConstruct } from '../notifier-constructs/sqs/main-queue.construct';
import { WebhooksQueueConstruct } from '../notifier-constructs/sqs/webhooks-queue.construct';
import { WebhookDeadLetterQueueConstruct } from '../notifier-constructs/sqs/webhook-dead-letter-queue.construct';
import { EnqueueFnConstruct } from '../notifier-constructs/lambda/enqueue/enqueue-fn.construct';
import { QueryFnConstruct } from '../notifier-constructs/lambda/query/query-fn.construct';
import { SenderFnConstruct } from '../notifier-constructs/lambda/sender/sender-fn.construct';
import { DlqProcessorFnConstruct } from '../notifier-constructs/lambda/dlq-processor/dlq-processor-fn.construct';
import { RelayFnConstruct } from '../notifier-constructs/lambda/relay/relay-fn.construct';
import { WebhookDispatcherFnConstruct } from '../notifier-constructs/lambda/webhook-dispatcher/webhook-dispatcher-fn.construct';
import { HttpApiConstruct } from '../notifier-constructs/api-gateway/http-api.construct';
import { SchedulerExecutionRoleConstruct } from '../notifier-constructs/iam/scheduler-execution-role.construct';

interface NotifierHubStackProps extends cdk.StackProps {
  sesSourceEmail: string;
}

export class NotifierHubStack extends cdk.Stack {
  readonly enqueueFn: NodejsFunction;
  readonly queryFn: NodejsFunction;
  readonly senderFn: NodejsFunction;
  readonly dlqProcessorFn: NodejsFunction;
  readonly relayFn: NodejsFunction;
  readonly webhookDispatcherFn: NodejsFunction;
  readonly notificationsQueue: sqs.Queue;
  readonly webhooksQueue: sqs.Queue;
  readonly notificationsDlq: sqs.Queue;
  readonly webhooksDlq: sqs.Queue;
  readonly notificationsTable: dynamodb.Table;
  readonly templatesTable: dynamodb.Table;
  readonly outboxTable: dynamodb.Table;

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
      templatesTable: templates.table,
      sesSourceEmail: props.sesSourceEmail,
    });

    const queryFn = new QueryFnConstruct(this, 'QueryFn', { table: notifications.table });

    const senderFn = new SenderFnConstruct(this, 'WorkerFn', {
      table: notifications.table,
      outboxTable: outbox.table,
      queue: queue.queue,
      sesSourceEmail: props.sesSourceEmail,
    });

    const dlqProcessorFn = new DlqProcessorFnConstruct(this, 'DlqProcessorFn', {
      table: notifications.table,
      outboxTable: outbox.table,
      dlq: dlq.queue,
      webhookDlq: webhookDlq.queue,
    });

    const schedulerExecutionRole = new SchedulerExecutionRoleConstruct(
      this,
      'SchedulerExecutionRole',
      { notificationsQueueArn: queue.queue.queueArn },
    );

    const relayFn = new RelayFnConstruct(this, 'RelayFn', {
      outboxTable: outbox.table,
      notificationsTable: notifications.table,
      notificationsQueue: queue.queue,
      webhooksQueue: webhooksQueue.queue,
      schedulerExecutionRoleArn: schedulerExecutionRole.role.roleArn,
    });

    const webhookDispatcherFn = new WebhookDispatcherFnConstruct(this, 'WebhookDispatcherFn', {
      table: notifications.table,
      webhooksQueue: webhooksQueue.queue,
    });

    const api = new HttpApiConstruct(this, 'HttpApi', {
      enqueueFn: enqueueFn.fn,
      queryFn: queryFn.fn,
    });

    this.enqueueFn = enqueueFn.fn;
    this.queryFn = queryFn.fn;
    this.senderFn = senderFn.fn;
    this.dlqProcessorFn = dlqProcessorFn.fn;
    this.relayFn = relayFn.fn;
    this.webhookDispatcherFn = webhookDispatcherFn.fn;
    this.notificationsQueue = queue.queue;
    this.webhooksQueue = webhooksQueue.queue;
    this.notificationsDlq = dlq.queue;
    this.webhooksDlq = webhookDlq.queue;
    this.notificationsTable = notifications.table;
    this.templatesTable = templates.table;
    this.outboxTable = outbox.table;

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url, description: 'URL del API Gateway' });

    new cdk.CfnOutput(this, 'QueueUrl', {
      value: queue.queue.queueUrl,
      description: 'URL de la cola SQS principal',
    });
    new cdk.CfnOutput(this, 'DlqUrl', {
      value: dlq.queue.queueUrl,
      description: 'URL de la cola de mensajes fallidos',
    });
    new cdk.CfnOutput(this, 'WebhooksQueueUrl', {
      value: webhooksQueue.queue.queueUrl,
      description: 'URL de la cola de webhooks',
    });
    new cdk.CfnOutput(this, 'WebhooksDlqUrl', {
      value: webhookDlq.queue.queueUrl,
      description: 'URL de la cola de mensajes fallidos de webhooks',
    });
    new cdk.CfnOutput(this, 'OutboxTableName', {
      value: outbox.table.tableName,
      description: 'Nombre de la tabla outbox',
    });
    new cdk.CfnOutput(this, 'TemplatesTableName', {
      value: templates.table.tableName,
      description: 'Nombre de la tabla de plantillas',
    });
  }
}
