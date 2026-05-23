import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { EnqueueModule } from './enqueue.module';
import { EnqueueController } from '../controller/enqueue.controller';

export const handler = createLambdaHandler<
  EnqueueController,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult
>(EnqueueModule, EnqueueController, (ctrl, event) => {
  const extracted = LambdaEventMiddleware.extract(event) as ApiGwExtracted;
  return ctrl.handle(extracted.body);
});
