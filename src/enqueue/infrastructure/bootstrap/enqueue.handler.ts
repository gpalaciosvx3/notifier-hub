import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { EnqueueModule } from './enqueue.module';
import { EnqueueController } from '../controller/enqueue.controller';

export const handler = createLambdaHandler<EnqueueController, APIGatewayProxyEventV2, APIGatewayProxyResultV2>(
  EnqueueModule,
  EnqueueController,
  (ctrl, evento) => ctrl.handle(evento),
);
