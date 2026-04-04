import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { QueryModule } from './query.module';
import { QueryController } from '../controller/query.controller';

export const handler = createLambdaHandler<QueryController, unknown, APIGatewayProxyResultV2>(
  QueryModule,
  QueryController,
  (ctrl, event) => ctrl.handle(LambdaEventMiddleware.extract(event) as ApiGwExtracted),
);
