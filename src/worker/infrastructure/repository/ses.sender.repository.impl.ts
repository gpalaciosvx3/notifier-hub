import { Injectable } from '@nestjs/common';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '../../../common/config/aws.config';
import { SesSenderRepository } from '../../domain/repository/notification.sender.repository';

@Injectable()
export class SesSenderRepositoryImpl extends SesSenderRepository {
  constructor(private readonly sourceEmail: string) {
    super();
  }

  async send(para: string, asunto: string | undefined, cuerpo: string): Promise<void> {
    await sesClient.send(
      new SendEmailCommand({
        Source: this.sourceEmail,
        Destination: { ToAddresses: [para] },
        Message: {
          Subject: { Data: asunto ?? '' },
          Body: { Text: { Data: cuerpo } },
        },
      }),
    );
  }
}
