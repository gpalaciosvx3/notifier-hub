import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  SQSEvent,
  DynamoDBStreamEvent,
} from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { LambdaExtracted } from './types/lambda-event.types';

export class LambdaEventMiddleware {
  static extract(event: unknown): LambdaExtracted {
    if (LambdaEventMiddleware.isApiGwV2(event)) {
      const e = event as APIGatewayProxyEventV2;
      return {
        source: 'api-gw',
        body: JSON.parse(e.body ?? '{}'),
        pathParameters: (e.pathParameters ?? {}) as Record<string, string>,
        queryStringParameters: (e.queryStringParameters ?? {}) as Record<string, string>,
        headers: LambdaEventMiddleware.normalizeHeaders(e.headers),
      };
    }

    if (LambdaEventMiddleware.isApiGwV1(event)) {
      const e = event as APIGatewayProxyEvent;
      return {
        source: 'api-gw',
        body: JSON.parse(e.body ?? '{}'),
        pathParameters: (e.pathParameters ?? {}) as Record<string, string>,
        queryStringParameters: (e.queryStringParameters ?? {}) as Record<string, string>,
        headers: LambdaEventMiddleware.normalizeHeaders(e.headers ?? {}),
      };
    }

    if (LambdaEventMiddleware.isSqs(event)) {
      const e = event as SQSEvent;
      return {
        source: 'sqs',
        records: e.Records.map((r) => ({
          body: JSON.parse(r.body),
          messageId: r.messageId,
          sequenceNumber: r.messageId,
        })),
      };
    }

    if (LambdaEventMiddleware.isDynamoStream(event)) {
      const e = event as DynamoDBStreamEvent;
      return {
        source: 'dynamodb-stream',
        records: e.Records.filter((r) => r.eventName === 'INSERT' && r.dynamodb?.NewImage).map(
          (r) => ({
            sequenceNumber: r.dynamodb!.SequenceNumber!,
            newImage: unmarshall(r.dynamodb!.NewImage! as Record<string, AttributeValue>),
          }),
        ),
      };
    }

    throw new Error(`Evento no reconocido`);
  }

  private static isApiGwV2(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      typeof e['requestContext'] === 'object' &&
      e['requestContext'] !== null &&
      'http' in (e['requestContext'] as object)
    );
  }

  private static isApiGwV1(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      typeof e['requestContext'] === 'object' &&
      e['requestContext'] !== null &&
      'httpMethod' in (e['requestContext'] as object)
    );
  }

  private static isSqs(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      Array.isArray(e['Records']) &&
      (e['Records'] as Record<string, unknown>[])[0]?.['eventSource'] === 'aws:sqs'
    );
  }

  private static isDynamoStream(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      Array.isArray(e['Records']) &&
      (e['Records'] as Record<string, unknown>[])[0]?.['eventSource'] === 'aws:dynamodb'
    );
  }

  private static normalizeHeaders(headers: Record<string, string | undefined>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(headers)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k.toLowerCase(), v as string]),
    );
  }
}
