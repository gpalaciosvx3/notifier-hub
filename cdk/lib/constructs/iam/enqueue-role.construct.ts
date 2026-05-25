import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface EnqueueRoleProps {
  notificationsTableArn: string;
  outboxTableArn: string;
  templatesTableArn: string;
}

export class EnqueueRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: EnqueueRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName: ResourceConstants.ENQUEUE_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['dynamodb:PutItem', 'dynamodb:GetItem'],
              resources: [props.notificationsTableArn],
            }),
            new iam.PolicyStatement({
              actions: ['dynamodb:PutItem'],
              resources: [props.outboxTableArn],
            }),
            new iam.PolicyStatement({
              actions: ['dynamodb:Query'],
              resources: [props.templatesTableArn],
            }),
          ],
        }),
      },
    });
  }
}
