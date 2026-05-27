import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface WebhookDispatcherRoleProps {
  notificationsTableArn: string;
  webhooksQueueArn: string;
}

export class WebhookDispatcherRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: WebhookDispatcherRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName: ResourceConstants.WEBHOOK_DISPATCHER_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['dynamodb:UpdateItem'],
              resources: [props.notificationsTableArn],
            }),
          ],
        }),
        SqsConsume: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
                'sqs:ChangeMessageVisibility',
              ],
              resources: [props.webhooksQueueArn],
            }),
          ],
        }),
      },
    });
  }
}
