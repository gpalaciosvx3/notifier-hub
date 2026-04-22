import { Injectable } from '@nestjs/common';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '../../../common/config/aws.config';
import { NotificationSqsRepository } from '../../domain/repository/notification.sqs.repository';
import { NotificationEntity } from '../../../common/entities/notification.entity';

@Injectable()
export class NotificationSqsRepositoryImpl extends NotificationSqsRepository {
  constructor(private readonly queueUrl: string) {
    super();
  }

  async enqueue(notificacion: NotificationEntity): Promise<void> {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(notificacion),
      }),
    );
  }
}
