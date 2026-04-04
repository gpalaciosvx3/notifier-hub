import { Injectable } from '@nestjs/common';
import { SQSEvent } from 'aws-lambda';
import { NotificationEntity } from '../../../common/entities/notification.entity';

@Injectable()
export class SqsEventParser {
  parsear(evento: SQSEvent): string[] {
    return evento.Records.map(r => (JSON.parse(r.body) as NotificationEntity).notificationId);
  }
}
