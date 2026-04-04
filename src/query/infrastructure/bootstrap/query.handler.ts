import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { QueryModule } from './query.module';
import { QueryController } from '../controller/query.controller';

export const handler = createLambdaHandler<QueryController, APIGatewayProxyEventV2, APIGatewayProxyResultV2>(
  QueryModule,
  QueryController,
  (ctrl, evento) => ctrl.handle(evento),
);
