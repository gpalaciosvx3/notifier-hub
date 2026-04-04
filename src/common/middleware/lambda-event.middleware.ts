import { APIGatewayProxyEventV2, SQSEvent } from 'aws-lambda';
import { ApiGwExtracted, SqsExtracted, LambdaExtracted } from './types/lambda-event.types';

export class LambdaEventMiddleware {
  static extract(event: unknown): LambdaExtracted {
    if (LambdaEventMiddleware.isApiGw(event)) {
      const e = event as APIGatewayProxyEventV2;
      return {
        source: 'api-gw',
        body: JSON.parse(e.body ?? '{}'),
        pathParameters: (e.pathParameters ?? {}) as Record<string, string>,
        queryStringParameters: (e.queryStringParameters ?? {}) as Record<string, string>,
      };
    }

    if (LambdaEventMiddleware.isSqs(event)) {
      const e = event as SQSEvent;
      return {
        source: 'sqs',
        records: e.Records.map(r => ({
          body: JSON.parse(r.body),
          messageId: r.messageId,
        })),
      };
    }

    throw new Error(`Evento no reconocido`);
  }

  private static isApiGw(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      typeof e['requestContext'] === 'object' &&
      e['requestContext'] !== null &&
      'http' in (e['requestContext'] as object)
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
}
