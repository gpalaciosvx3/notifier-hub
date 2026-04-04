import { Injectable } from '@nestjs/common';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '../../../common/config/aws.config';
import { SesSenderRepository } from '../../domain/repository/notification.sender.repository';
import { envConfig } from '../../../common/config/env.config';

@Injectable()
export class SesSenderRepositoryImpl extends SesSenderRepository {
  async send(para: string, asunto: string | undefined, cuerpo: string): Promise<void> {
    await sesClient.send(
      new SendEmailCommand({
        Source: envConfig.sesSourceEmail,
        Destination: { ToAddresses: [para] },
        Message: {
          Subject: { Data: asunto ?? '' },
          Body: { Text: { Data: cuerpo } },
        },
      }),
    );
  }
}
