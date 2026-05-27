import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface WebhookDlqAlarmProps {
  queue: sqs.Queue;
}

export class WebhookDlqAlarmConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebhookDlqAlarmProps) {
    super(scope, id);

    new cloudwatch.Alarm(this, 'Alarm', {
      alarmName: ResourceConstants.ALARM_WEBHOOK_DLQ,
      alarmDescription:
        'Media severidad — un webhook nunca fue entregado al callbackUrl. La notificación ya fue enviada.',
      metric: props.queue.metricApproximateNumberOfMessagesVisible(),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
  }
}
