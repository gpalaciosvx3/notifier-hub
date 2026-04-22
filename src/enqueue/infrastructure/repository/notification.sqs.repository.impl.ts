import { Injectable } from '@nestjs/common';
import { SqsClient } from '../../../common/sqs/sqs.client';
import { NotificationSqsRepository } from '../../domain/repository/notification.sqs.repository';
import { NotificationEntity } from '../../../common/entities/notification.entity';

@Injectable()
export class NotificationSqsRepositoryImpl extends NotificationSqsRepository {
  constructor(
    private readonly sqsClient: SqsClient,
    private readonly queueUrl: string,
  ) {
    super();
  }

  async enqueue(notificacion: NotificationEntity): Promise<void> {
    await this.sqsClient.sendMessage(this.queueUrl, JSON.stringify(notificacion));
  }
}
