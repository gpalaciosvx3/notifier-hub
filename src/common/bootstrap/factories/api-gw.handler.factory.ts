import middy from '@middy/core';
import { Type } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { parseApiGwEventMiddleware, ApiGwHandlerEvent } from '../../middleware/lambda-event.middleware';
import { ApiGwController } from '../interfaces/lambda-controller.interfaces';
import { LambdaHandlerFactory } from './lambda-handler.factory';

export class ApiGwHandlerFactory extends LambdaHandlerFactory<ApiGwHandlerEvent, APIGatewayProxyResult, ApiGwController> {
  protected createHandler(getController: () => Promise<ApiGwController>) {
    return middy<ApiGwHandlerEvent, APIGatewayProxyResult>(async (event) => {
      const ctrl = await getController();
      return ctrl.handle(event.parsed);
    }).use(parseApiGwEventMiddleware());
  }
}
