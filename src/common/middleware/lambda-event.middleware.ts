import { MiddlewareObj } from '@middy/core';
import { APIGatewayProxyEventV2, SQSEvent, DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { ApiGwExtracted, SqsExtracted, DynamoStreamExtracted } from './types/lambda-event.types';

export type ApiGwHandlerEvent = APIGatewayProxyEventV2 & { parsed: ApiGwExtracted };
export type SqsHandlerEvent = SQSEvent & { parsed: SqsExtracted };
export type DynamoStreamHandlerEvent = DynamoDBStreamEvent & { parsed: DynamoStreamExtracted };

export const parseApiGwEventMiddleware = <TResult>(): MiddlewareObj<ApiGwHandlerEvent, TResult> => ({
  before: (request) => {
    const e = request.event;
    request.event.parsed = {
      source: 'api-gw',
      body: JSON.parse(e.body ?? '{}'),
      pathParameters: (e.pathParameters ?? {}) as Record<string, string>,
      queryStringParameters: (e.queryStringParameters ?? {}) as Record<string, string>,
      headers: normalizeHeaders(e.headers),
    };
  },
});

export const parseSqsEventMiddleware = <TResult>(): MiddlewareObj<SqsHandlerEvent, TResult> => ({
  before: (request) => {
    const e = request.event;
    request.event.parsed = {
      source: 'sqs',
      records: e.Records.map((r) => ({
        body: JSON.parse(r.body),
        messageId: r.messageId,
        sequenceNumber: r.messageId,
      })),
    };
  },
});

export const parseDynamoStreamEventMiddleware = <TResult>(): MiddlewareObj<DynamoStreamHandlerEvent, TResult> => ({
  before: (request) => {
    const e = request.event;
    request.event.parsed = {
      source: 'dynamodb-stream',
      records: e.Records.filter((r) => r.eventName === 'INSERT' && r.dynamodb?.NewImage).map((r) => ({
        sequenceNumber: r.dynamodb!.SequenceNumber!,
        newImage: unmarshall(r.dynamodb!.NewImage! as Record<string, AttributeValue>),
      })),
    };
  },
});

const normalizeHeaders = (headers: Record<string, string | undefined>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k.toLowerCase(), v as string]),
  );

