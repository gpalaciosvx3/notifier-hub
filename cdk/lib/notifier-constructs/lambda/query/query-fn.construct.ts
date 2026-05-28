import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import { lambdaBundling, repoRoot } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';
import { QueryRoleConstruct } from '../../iam/query-role.construct';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';

interface QueryFnProps {
  table: dynamodb.Table;
}

export class QueryFnConstruct extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: QueryFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_QUERY,
    });

    const { role } = new QueryRoleConstruct(this, 'Role', {
      notificationsTableArn: props.table.tableArn,
    });

    this.fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_QUERY,
      description: 'Consulta el estado e historial de notificaciones desde DynamoDB',
      logGroup,
      role,
      entry: path.join(
        __dirname,
        '../../../../../src/query/infrastructure/bootstrap/query.handler.ts',
      ),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_DEFAULT_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      tracing: lambda.Tracing.ACTIVE,
      projectRoot: repoRoot,
      bundling: lambdaBundling,
      environment: {
        NOTIFICATIONS_TABLE: props.table.tableName,
        POWERTOOLS_SERVICE_NAME: ResourceConstants.LAMBDA_QUERY,
        POWERTOOLS_METRICS_NAMESPACE: ResourceConstants.METRICS_NAMESPACE,
      },
    });
  }
}
