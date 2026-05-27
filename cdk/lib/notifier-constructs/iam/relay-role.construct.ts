import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface RelayRoleProps {
  outboxTableArn: string;
  outboxStreamArn: string;
  notificationsTableArn: string;
  notificationsQueueArn: string;
  webhooksQueueArn: string;
  schedulerExecutionRoleArn: string;
}

export class RelayRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: RelayRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName: ResourceConstants.RELAY_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['dynamodb:UpdateItem'],
              resources: [props.outboxTableArn],
            }),
            new iam.PolicyStatement({
              actions: ['dynamodb:GetItem'],
              resources: [props.notificationsTableArn],
            }),
            new iam.PolicyStatement({
              actions: [
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:DescribeStream',
                'dynamodb:ListStreams',
              ],
              resources: [props.outboxStreamArn],
            }),
          ],
        }),
        SqsPublish: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['sqs:SendMessage'],
              resources: [props.notificationsQueueArn, props.webhooksQueueArn],
            }),
          ],
        }),
        SchedulerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['scheduler:CreateSchedule'],
              resources: [
                `arn:aws:scheduler:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:schedule/default/*`,
              ],
            }),
            new iam.PolicyStatement({
              actions: ['iam:PassRole'],
              resources: [props.schedulerExecutionRoleArn],
            }),
          ],
        }),
      },
    });
  }
}
