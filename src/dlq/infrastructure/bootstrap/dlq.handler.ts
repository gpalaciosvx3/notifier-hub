import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { DlqModule } from './dlq.module';
import { DlqController } from '../controller/dlq.controller';

export const handler = createLambdaHandler<DlqController, unknown, void>(
  DlqModule,
  DlqController,
  (ctrl, event) => ctrl.handle(LambdaEventMiddleware.extract(event) as SqsExtracted),
);
