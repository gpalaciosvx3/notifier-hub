import { Injectable } from '@nestjs/common';
import { SchedulerClient, CreateScheduleCommand, FlexibleTimeWindowMode } from '@aws-sdk/client-scheduler';
import { ulid } from 'ulid';
import { envConfig } from '../../../common/config/env.config';
import { SchedulerRepository } from '../../domain/repository/scheduler.repository';

@Injectable()
export class SchedulerRepositoryImpl extends SchedulerRepository {
  private readonly client = new SchedulerClient({ region: envConfig.awsRegion });

  async schedule(payload: string, scheduledAt: string, targetQueueUrl: string): Promise<void> {
    const scheduleExpression = `at(${scheduledAt.replace('Z', '').slice(0, 19)})`;
    await this.client.send(new CreateScheduleCommand({
      Name: `relay-${ulid()}`,
      ScheduleExpression: scheduleExpression,
      ScheduleExpressionTimezone: 'UTC',
      Target: {
        Arn: targetQueueUrl,
        RoleArn: process.env['SCHEDULER_ROLE_ARN'] as string,
        Input: payload,
      },
      FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
      ActionAfterCompletion: 'DELETE',
    }));
  }
}
