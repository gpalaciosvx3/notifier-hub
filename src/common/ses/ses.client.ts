import { Injectable } from '@nestjs/common';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '../config/aws.config';
import { awsError } from '../errors/aws-error.mapper';
import { ErrorDictionary } from '../errors/error.dictionary';

@Injectable()
export class SesClient {
  async sendEmail(source: string, to: string, subject: string | undefined, body: string): Promise<void> {
    await awsError(
      () =>
        sesClient.send(
          new SendEmailCommand({
            Source: source,
            Destination: { ToAddresses: [to] },
            Message: {
              Subject: { Data: subject ?? '' },
              Body: { Text: { Data: body } },
            },
          }),
        ),
      ErrorDictionary.SES_UNAVAILABLE,
    );
  }
}
