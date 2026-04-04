import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';
import { lambdaBundling } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';
import { WorkerRoleConstruct } from '../../iam/worker-role.construct';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';

interface WorkerFnProps {
  table: dynamodb.Table;
  queue: sqs.Queue;
  sesSourceEmail: string;
}

export class WorkerFnConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WorkerFnProps) {
    super(scope, id);

    const { role } = new WorkerRoleConstruct(this, 'Role');

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_WORKER,
    });

    const fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_WORKER,
      logGroup,
      entry: path.join(__dirname, '../../../../../src/worker/infrastructure/bootstrap/worker.handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_WORKER_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_WORKER_MB,
      bundling: lambdaBundling,
      role,
      environment: {
        NOTIFICATIONS_TABLE:    props.table.tableName,
        SES_SOURCE_EMAIL:       props.sesSourceEmail,
        EMAIL_DEFAULT_PROVIDER: 'ses',
        SMS_DEFAULT_PROVIDER:   'sns',
      },
    });

    props.table.grantReadWriteData(fn);

    fn.addEventSource(new SqsEventSource(props.queue, {
      batchSize: InfraConstants.SQS_BATCH_SIZE,
      reportBatchItemFailures: true,
    }));
  }
}
