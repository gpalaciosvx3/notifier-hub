import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { WorkerModule } from './worker.module';
import { WorkerController } from '../controller/worker.controller';

export const handler = createLambdaHandler<WorkerController, SQSEvent, SQSBatchResponse>(
  WorkerModule,
  WorkerController,
  async (ctrl, event) => {
    const extracted = LambdaEventMiddleware.extract(event) as SqsExtracted;
    const results: ProcessRecordResult[] = await ctrl.handle(extracted);
    return { batchItemFailures: results.filter(r => r.retry).map(r => ({ itemIdentifier: r.sequenceNumber })) };
  },
);
