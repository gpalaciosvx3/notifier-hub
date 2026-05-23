import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { WebhookDispatcherModule } from './webhook-dispatcher.module';
import { WebhookDispatcherController } from '../controller/webhook-dispatcher.controller';

export const handler = createLambdaHandler<
  WebhookDispatcherController,
  SQSEvent,
  SQSBatchResponse
>(WebhookDispatcherModule, WebhookDispatcherController, async (ctrl, event) => {
  const extracted = LambdaEventMiddleware.extract(event) as SqsExtracted;
  const results: ProcessRecordResult[] = await ctrl.handle(extracted);
  return {
    batchItemFailures: results
      .filter((r) => r.retry)
      .map((r) => ({ itemIdentifier: r.sequenceNumber })),
  };
});
