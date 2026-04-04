export type ApiGwExtracted = {
  source: 'api-gw';
  body: unknown;
  pathParameters: Record<string, string>;
  queryStringParameters: Record<string, string>;
};

export type SqsMessage = {
  body: unknown;
  messageId: string;
};

export type SqsExtracted = {
  source: 'sqs';
  records: SqsMessage[];
};

export type LambdaExtracted = ApiGwExtracted | SqsExtracted;
