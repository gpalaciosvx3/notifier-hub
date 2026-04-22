import { Injectable } from '@nestjs/common';
import { PublishCommand } from '@aws-sdk/client-sns';
import { snsClient } from '../config/aws.config';
import { awsError } from '../errors/aws-error.mapper';
import { ErrorDictionary } from '../errors/error.dictionary';

@Injectable()
export class SnsClient {
  async publish(phoneNumber: string, message: string): Promise<void> {
    await awsError(
      () => snsClient.send(new PublishCommand({ PhoneNumber: phoneNumber, Message: message })),
      ErrorDictionary.SNS_UNAVAILABLE,
    );
  }
}
