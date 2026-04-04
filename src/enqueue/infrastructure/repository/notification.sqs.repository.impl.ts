import { Injectable } from '@nestjs/common';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '../../../common/config/aws.config';
import { NotificationSqsRepository } from '../../domain/repository/notification.sqs.repository';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { envConfig } from '../../../common/config/env.config';

@Injectable()
export class NotificationSqsRepositoryImpl extends NotificationSqsRepository {
  async enqueue(notificacion: NotificationEntity): Promise<void> {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: envConfig.notificationsQueueUrl,
        MessageBody: JSON.stringify(notificacion),
      }),
    );
  }
}
