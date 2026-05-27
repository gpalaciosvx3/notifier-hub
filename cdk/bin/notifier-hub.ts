import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NotifierHubStack } from '../lib/stacks/notifier-hub.stack';
import { ObservabilityStack } from '../lib/stacks/observability.stack';
import { ResourceConstants } from '../common/constants/resource.constants';
import { InfraConstants } from '../common/constants/infra.constants';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const notifierHub = new NotifierHubStack(app, 'NotifierHubStack', {
  sesSourceEmail: process.env.SES_SOURCE_EMAIL ?? 'test@example.com',
  env,
});

new ObservabilityStack(app, 'ObservabilityStack', {
  lambdaFunctions: [
    { fn: notifierHub.enqueueFn, name: 'enqueue' },
    { fn: notifierHub.queryFn, name: 'query' },
    { fn: notifierHub.senderFn, name: 'sender' },
    { fn: notifierHub.dlqProcessorFn, name: 'dlq-processor' },
    { fn: notifierHub.relayFn, name: 'relay' },
    { fn: notifierHub.webhookDispatcherFn, name: 'webhook-dispatcher' },
  ],
  processingQueues: [notifierHub.notificationsQueue, notifierHub.webhooksQueue],
  deadLetterQueues: [notifierHub.notificationsDlq, notifierHub.webhooksDlq],
  tables: [notifierHub.notificationsTable, notifierHub.templatesTable, notifierHub.outboxTable],
  businessMetricNamespace: ResourceConstants.METRICS_NAMESPACE,
  businessMetricNames: [
    'notifications_accepted',
    'notifications_rejected',
    'notifications_sent',
    'notifications_failed_permanent',
    'webhooks_delivered',
    'webhooks_failed_permanent',
  ],
  dashboardName: ResourceConstants.DASHBOARD_NAME,
  environment: 'prod',
  errorRatePercent: InfraConstants.LAMBDA_ALARM_ERROR_RATE_PERCENT,
  p99DurationMs: InfraConstants.LAMBDA_ALARM_P99_DURATION_MS,
  queueAgeSeconds: InfraConstants.LAMBDA_ALARM_QUEUE_AGE_SECONDS,
  env,
});
