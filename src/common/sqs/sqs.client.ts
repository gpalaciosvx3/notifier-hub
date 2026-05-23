import { Injectable } from '@nestjs/common';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '../config/aws.config';
import { awsError } from '../errors/aws-error.mapper';
import { ErrorDictionary } from '../errors/error.dictionary';

@Injectable()
export class SqsClient {
  async sendMessage(queueUrl: string, messageBody: string): Promise<void> {
    await awsError(
      () =>
        sqsClient.send(new SendMessageCommand({ QueueUrl: queueUrl, MessageBody: messageBody })),
      ErrorDictionary.SQS_UNAVAILABLE,
    );
  }
}
