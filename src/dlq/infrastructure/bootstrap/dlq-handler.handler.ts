import { SQSEvent } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { DlqModule } from './dlq.module';
import { DlqController } from '../controller/dlq.controller';

export const handler = createLambdaHandler<DlqController, SQSEvent, void>(
  DlqModule,
  DlqController,
  (ctrl, evento) => ctrl.handle(evento),
);
