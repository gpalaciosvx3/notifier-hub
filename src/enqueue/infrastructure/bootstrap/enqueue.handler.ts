import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { EnqueueModule } from './enqueue.module';
import { EnqueueController } from '../controller/enqueue.controller';

export const handler = createLambdaHandler<EnqueueController, unknown, APIGatewayProxyResultV2>(
  EnqueueModule,
  EnqueueController,
  (ctrl, event) => ctrl.handle(LambdaEventMiddleware.extract(event) as ApiGwExtracted),
);
