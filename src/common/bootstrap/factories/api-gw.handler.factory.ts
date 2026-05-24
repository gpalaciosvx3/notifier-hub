import middy from '@middy/core';
import { Type } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { parseApiGwEventMiddleware, ApiGwHandlerEvent } from '../../middleware/lambda-event.middleware';
import { ApiGwController } from '../interfaces/lambda-controller.interfaces';
import { createNestController } from './nest-context.factory';

export const createApiGwHandler = (Module: Type, Controller: Type<ApiGwController>) => {
  const getController = createNestController(Module, Controller);
  return middy<ApiGwHandlerEvent, APIGatewayProxyResult>(async (event) => {
    const ctrl = await getController();
    return ctrl.handle(event.parsed);
  }).use(parseApiGwEventMiddleware());
};
