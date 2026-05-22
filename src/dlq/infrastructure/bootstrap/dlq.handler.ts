import { SQSEvent } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { DlqModule } from './dlq.module';
import { DlqController } from '../controller/dlq.controller';

export const handler = createLambdaHandler<DlqController, SQSEvent, void>(
  DlqModule,
  DlqController,
  (ctrl, event) => {
    const extracted = LambdaEventMiddleware.extract(event) as SqsExtracted;
    return ctrl.handle(extracted);
  },
);
