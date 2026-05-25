import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface DlqProcessorRoleProps {
  notificationsTableArn: string;
  outboxTableArn: string;
  dlqArn: string;
  webhookDlqArn: string;
}

export class DlqProcessorRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: DlqProcessorRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName: ResourceConstants.DLQ_PROCESSOR_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['dynamodb:UpdateItem', 'dynamodb:PutItem'],
              resources: [props.notificationsTableArn],
            }),
            new iam.PolicyStatement({
              actions: ['dynamodb:PutItem'],
              resources: [props.outboxTableArn],
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
              resources: [props.dlqArn, props.webhookDlqArn],
            }),
          ],
        }),
      },
    });
  }
}
