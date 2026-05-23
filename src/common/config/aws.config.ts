import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SESClient } from '@aws-sdk/client-ses';
import { SNSClient } from '@aws-sdk/client-sns';
import { envConfig } from './env.config';

export const dynamoDbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: envConfig.awsRegion }),
);
export const sqsClient = new SQSClient({ region: envConfig.awsRegion });
export const sesClient = new SESClient({ region: envConfig.awsRegion });
export const snsClient = new SNSClient({ region: envConfig.awsRegion });
