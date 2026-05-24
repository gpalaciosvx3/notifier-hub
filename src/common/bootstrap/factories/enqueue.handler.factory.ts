import middy from '@middy/core';
import { Type } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { parseApiGwEventMiddleware } from '../../middleware/lambda-event.middleware';
import { requireIdempotencyKeyMiddleware, EnqueueHandlerEvent } from '../../middleware/idempotency.middleware';
import { EnqueueApiGwController } from '../interfaces/lambda-controller.interfaces';
import { LambdaHandlerFactory } from './lambda-handler.factory';

export class EnqueueHandlerFactory extends LambdaHandlerFactory<EnqueueHandlerEvent, APIGatewayProxyResult, EnqueueApiGwController> {
  protected createHandler(getController: () => Promise<EnqueueApiGwController>) {
    return middy<EnqueueHandlerEvent, APIGatewayProxyResult>(async (event) => {
      const ctrl = await getController();
      return ctrl.handle(event.parsed.body, event.idempotencyKey);
    })
      .use(parseApiGwEventMiddleware())
      .use(requireIdempotencyKeyMiddleware());
  }
}
