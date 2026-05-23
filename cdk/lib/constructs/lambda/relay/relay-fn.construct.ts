import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';
import { lambdaBundling } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';

interface RelayFnProps {
  outboxTable: dynamodb.Table;
  notificationsTable: dynamodb.Table;
  notificationsQueue: sqs.Queue;
  webhooksQueue: sqs.Queue;
}

export class RelayFnConstruct extends Construct {
  constructor(scope: Construct, id: string, props: RelayFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_RELAY,
    });

    const fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_RELAY,
      description: 'Lee el stream de la tabla outbox y publica eventos en los brokers correspondientes (SQS / Scheduler)',
      logGroup,
      entry: path.join(__dirname, '../../../../../src/relay/infrastructure/bootstrap/relay.handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_RELAY_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      bundling: lambdaBundling,
      environment: {
        OUTBOX_TABLE:            props.outboxTable.tableName,
        NOTIFICATIONS_QUEUE_URL: props.notificationsQueue.queueUrl,
        WEBHOOKS_QUEUE_URL:      props.webhooksQueue.queueUrl,
      },
    });

    props.outboxTable.grantReadWriteData(fn);
    props.notificationsQueue.grantSendMessages(fn);
    props.webhooksQueue.grantSendMessages(fn);

    fn.addEventSource(new DynamoEventSource(props.outboxTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 10,
      retryAttempts: 3,
    }));
  }
}
