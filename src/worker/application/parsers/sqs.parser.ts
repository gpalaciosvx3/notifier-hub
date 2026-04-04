import { Injectable } from '@nestjs/common';
import { SQSEvent } from 'aws-lambda';
import { NotificationEntity } from '../../../common/entities/notification.entity';

export type WorkerRecord = {
  notification: NotificationEntity;
  messageId: string;
};

@Injectable()
export class SqsEventParser {
  parse(event: SQSEvent): WorkerRecord[] {
    return event.Records.map(r => ({
      notification: JSON.parse(r.body) as NotificationEntity,
      messageId: r.messageId,
    }));
  }
}
