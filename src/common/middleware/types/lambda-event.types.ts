export type ApiGwExtracted = {
  source: 'api-gw';
  body: unknown;
  pathParameters: Record<string, string>;
  queryStringParameters: Record<string, string>;
  headers: Record<string, string>;
};

export type SqsMessage = {
  body: unknown;
  messageId: string;
  sequenceNumber: string;
};

export type SqsExtracted = {
  source: 'sqs';
  records: SqsMessage[];
};

export type DynamoStreamRecord = {
  sequenceNumber: string;
  newImage: Record<string, unknown>;
};

export type DynamoStreamExtracted = {
  source: 'dynamodb-stream';
  records: DynamoStreamRecord[];
};

export type LambdaExtracted = ApiGwExtracted | SqsExtracted | DynamoStreamExtracted;
