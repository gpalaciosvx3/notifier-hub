import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { QueryModule } from './query.module';
import { QueryController } from '../controller/query.controller';

export const handler = createLambdaHandler<
  QueryController,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult
>(QueryModule, QueryController, (ctrl, event) => {
  const extracted = LambdaEventMiddleware.extract(event) as ApiGwExtracted;
  return ctrl.handle(extracted);
});
