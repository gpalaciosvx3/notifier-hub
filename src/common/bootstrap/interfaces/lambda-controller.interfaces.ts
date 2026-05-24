import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiGwExtracted, DynamoStreamExtracted, SqsExtracted } from '../../middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../types/process-record-result.types';

export interface ApiGwController {
  handle(event: ApiGwExtracted): Promise<APIGatewayProxyResult>;
}

export interface EnqueueApiGwController {
  handle(body: unknown, idempotencyKey: string): Promise<APIGatewayProxyResult>;
}

export interface SqsBatchController {
  handle(event: SqsExtracted): Promise<ProcessRecordResult[]>;
}

export interface DynamoStreamBatchController {
  handle(event: DynamoStreamExtracted): Promise<ProcessRecordResult[]>;
}
