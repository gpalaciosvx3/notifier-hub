import { DynamoDBBatchResponse, DynamoDBStreamEvent } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { DynamoStreamExtracted } from '../../../common/middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { RelayModule } from './relay.module';
import { RelayController } from '../controller/relay.controller';

export const handler = createLambdaHandler<
  RelayController,
  DynamoDBStreamEvent,
  DynamoDBBatchResponse
>(RelayModule, RelayController, async (ctrl, event) => {
  const extracted = LambdaEventMiddleware.extract(event) as DynamoStreamExtracted;
  const results: ProcessRecordResult[] = await ctrl.handle(extracted);
  return {
    batchItemFailures: results
      .filter((r) => r.retry)
      .map((r) => ({ itemIdentifier: r.sequenceNumber })),
  };
});
