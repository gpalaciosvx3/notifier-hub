import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import { lambdaBundling } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';

interface EnqueueFnProps {
  table: dynamodb.Table;
  queue: sqs.Queue;
  sesSourceEmail: string;
}

export class EnqueueFnConstruct extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: EnqueueFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_ENQUEUE,
    });

    this.fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_ENQUEUE,
      logGroup,
      entry: path.join(__dirname, '../../../../../src/enqueue/infrastructure/bootstrap/enqueue.handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_DEFAULT_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      bundling: lambdaBundling,
      environment: {
        NOTIFICATIONS_TABLE:      props.table.tableName,
        NOTIFICATIONS_QUEUE_URL:  props.queue.queueUrl,
        SES_SOURCE_EMAIL:         props.sesSourceEmail,
        EMAIL_DEFAULT_PROVIDER:   'ses',
        SMS_DEFAULT_PROVIDER:     'sns',
      },
    });

    props.table.grantWriteData(this.fn);
    props.queue.grantSendMessages(this.fn);
  }
}
