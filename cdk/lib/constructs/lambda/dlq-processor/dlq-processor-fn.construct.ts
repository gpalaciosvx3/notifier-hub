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
import { DlqProcessorRoleConstruct } from '../../iam/dlq-processor-role.construct';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';

interface DlqProcessorFnProps {
  table: dynamodb.Table;
  outboxTable: dynamodb.Table;
  dlq: sqs.Queue;
  webhookDlq: sqs.Queue;
}

export class DlqProcessorFnConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DlqProcessorFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_DLQ_PROCESSOR,
    });

    const { role } = new DlqProcessorRoleConstruct(this, 'Role', {
      notificationsTableArn: props.table.tableArn,
      outboxTableArn: props.outboxTable.tableArn,
      dlqArn: props.dlq.queueArn,
      webhookDlqArn: props.webhookDlq.queueArn,
    });

    const fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_DLQ_PROCESSOR,
      description:
        'Procesa mensajes fallidos de la DLQ y marca las notificaciones como FAILED_PERMANENT',
      logGroup,
      role,
      entry: path.join(__dirname, '../../../../../src/dlq/infrastructure/bootstrap/dlq.handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_DEFAULT_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      projectRoot: repoRoot,
      bundling: lambdaBundling,
      environment: {
        NOTIFICATIONS_TABLE: props.table.tableName,
        OUTBOX_TABLE: props.outboxTable.tableName,
      },
    });

    fn.addEventSource(
      new SqsEventSource(props.dlq, {
        batchSize: InfraConstants.SQS_BATCH_SIZE,
        maxBatchingWindow: cdk.Duration.minutes(
          InfraConstants.SQS_DLQ_PROCESSOR_BATCH_WINDOW_MINUTES,
        ),
      }),
    );

    fn.addEventSource(
      new SqsEventSource(props.webhookDlq, {
        batchSize: InfraConstants.SQS_BATCH_SIZE,
        maxBatchingWindow: cdk.Duration.minutes(
          InfraConstants.SQS_DLQ_PROCESSOR_BATCH_WINDOW_MINUTES,
        ),
      }),
    );
  }
}
