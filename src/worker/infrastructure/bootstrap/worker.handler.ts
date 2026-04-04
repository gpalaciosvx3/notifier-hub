import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { WorkerModule } from './worker.module';
import { WorkerController } from '../controller/worker.controller';

export const handler = createLambdaHandler<WorkerController, SQSEvent, SQSBatchResponse>(
  WorkerModule,
  WorkerController,
  (ctrl, evento) => ctrl.handle(evento),
);
