import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';
import { lambdaBundling, repoRoot } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';
import { WebhookDispatcherRoleConstruct } from '../../iam/webhook-dispatcher-role.construct';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';

interface WebhookDispatcherFnProps {
  table: dynamodb.Table;
  webhooksQueue: sqs.Queue;
}

export class WebhookDispatcherFnConstruct extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: WebhookDispatcherFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_WEBHOOK_DISPATCHER,
    });

    const { role } = new WebhookDispatcherRoleConstruct(this, 'Role', {
      notificationsTableArn: props.table.tableArn,
      webhooksQueueArn: props.webhooksQueue.queueArn,
    });

    const fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_WEBHOOK_DISPATCHER,
      description:
        'Procesa mensajes de la cola de webhooks y hace POST al callbackUrl con reintentos exponenciales',
      logGroup,
      role,
      entry: path.join(
        __dirname,
        '../../../../../src/webhook-dispatcher/infrastructure/bootstrap/webhook-dispatcher.handler.ts',
      ),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_WEBHOOK_DISPATCHER_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      tracing: lambda.Tracing.ACTIVE,
      projectRoot: repoRoot,
      bundling: lambdaBundling,
      environment: {
        NOTIFICATIONS_TABLE: props.table.tableName,
        POWERTOOLS_SERVICE_NAME: ResourceConstants.LAMBDA_WEBHOOK_DISPATCHER,
        POWERTOOLS_METRICS_NAMESPACE: ResourceConstants.METRICS_NAMESPACE,
      },
    });

    this.fn = fn;

    fn.addEventSource(
      new SqsEventSource(props.webhooksQueue, {
        batchSize: InfraConstants.SQS_BATCH_SIZE,
        reportBatchItemFailures: true,
      }),
    );
  }
}
