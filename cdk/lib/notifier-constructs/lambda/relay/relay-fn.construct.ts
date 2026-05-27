import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';
import { lambdaBundling, repoRoot } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';
import { RelayRoleConstruct } from '../../iam/relay-role.construct';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';

interface RelayFnProps {
  outboxTable: dynamodb.Table;
  notificationsTable: dynamodb.Table;
  notificationsQueue: sqs.Queue;
  webhooksQueue: sqs.Queue;
  schedulerExecutionRoleArn: string;
}

export class RelayFnConstruct extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: RelayFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_RELAY,
    });

    const { role } = new RelayRoleConstruct(this, 'Role', {
      outboxTableArn: props.outboxTable.tableArn,
      outboxStreamArn: props.outboxTable.tableStreamArn!,
      notificationsTableArn: props.notificationsTable.tableArn,
      notificationsQueueArn: props.notificationsQueue.queueArn,
      webhooksQueueArn: props.webhooksQueue.queueArn,
      schedulerExecutionRoleArn: props.schedulerExecutionRoleArn,
    });

    const fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_RELAY,
      description:
        'Lee el stream de la tabla outbox y publica eventos en los brokers correspondientes (SQS / Scheduler)',
      logGroup,
      role,
      entry: path.join(
        __dirname,
        '../../../../../src/relay/infrastructure/bootstrap/relay.handler.ts',
      ),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_RELAY_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      tracing: lambda.Tracing.ACTIVE,
      projectRoot: repoRoot,
      bundling: lambdaBundling,
      environment: {
        OUTBOX_TABLE: props.outboxTable.tableName,
        NOTIFICATIONS_TABLE: props.notificationsTable.tableName,
        NOTIFICATIONS_QUEUE_URL: props.notificationsQueue.queueUrl,
        WEBHOOKS_QUEUE_URL: props.webhooksQueue.queueUrl,
        SCHEDULER_ROLE_ARN: props.schedulerExecutionRoleArn,
        POWERTOOLS_SERVICE_NAME: ResourceConstants.LAMBDA_RELAY,
        POWERTOOLS_METRICS_NAMESPACE: ResourceConstants.METRICS_NAMESPACE,
      },
    });

    this.fn = fn;

    fn.addEventSource(
      new DynamoEventSource(props.outboxTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        retryAttempts: 3,
        reportBatchItemFailures: true,
      }),
    );
  }
}
