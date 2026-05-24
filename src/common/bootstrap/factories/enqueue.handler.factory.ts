import middy from '@middy/core';
import { Type } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { parseApiGwEventMiddleware } from '../../middleware/lambda-event.middleware';
import { requireIdempotencyKeyMiddleware, EnqueueHandlerEvent } from '../../middleware/idempotency.middleware';
import { EnqueueApiGwController } from '../interfaces/lambda-controller.interfaces';
import { createNestController } from './nest-context.factory';

export const createEnqueueHandler = (Module: Type, Controller: Type<EnqueueApiGwController>) => {
  const getController = createNestController(Module, Controller);
  return middy<EnqueueHandlerEvent, APIGatewayProxyResult>(async (event) => {
    const ctrl = await getController();
    return ctrl.handle(event.parsed.body, event.idempotencyKey);
  })
    .use(parseApiGwEventMiddleware())
    .use(requireIdempotencyKeyMiddleware());
};
