import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { DlqModule } from './dlq.module';
import { DlqController } from '../controller/dlq.controller';

export const handler = createLambdaHandler<DlqController, SQSEvent, SQSBatchResponse>(
  DlqModule,
  DlqController,
  async (ctrl, event) => {
    const extracted = LambdaEventMiddleware.extract(event) as SqsExtracted;
    const results: ProcessRecordResult[] = await ctrl.handle(extracted);
    return { batchItemFailures: results.filter(r => r.retry).map(r => ({ itemIdentifier: r.sequenceNumber })) };
  },
);
