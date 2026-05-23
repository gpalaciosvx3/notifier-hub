import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface NotificationDlqAlarmProps {
  queue: sqs.Queue;
}

export class NotificationDlqAlarmConstruct extends Construct {
  constructor(scope: Construct, id: string, props: NotificationDlqAlarmProps) {
    super(scope, id);

    new cloudwatch.Alarm(this, 'Alarm', {
      alarmName: ResourceConstants.ALARM_NOTIFICATION_DLQ,
      alarmDescription:
        'Alta severidad — una notificación nunca fue enviada al destinatario. Requiere revisión inmediata.',
      metric: props.queue.metricApproximateNumberOfMessagesVisible(),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
  }
}
