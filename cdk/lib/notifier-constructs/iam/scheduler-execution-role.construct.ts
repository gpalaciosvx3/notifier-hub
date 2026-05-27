import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface SchedulerExecutionRoleProps {
  notificationsQueueArn: string;
}

export class SchedulerExecutionRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: SchedulerExecutionRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName: ResourceConstants.SCHEDULER_EXECUTION_ROLE,
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
      inlinePolicies: {
        SqsPublish: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['sqs:SendMessage'],
              resources: [props.notificationsQueueArn],
            }),
          ],
        }),
      },
    });
  }
}
