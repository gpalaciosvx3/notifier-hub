import { Type } from '@nestjs/common';
import { MiddyfiedHandler } from '@middy/core';
import { createNestController } from '../nest-app.context';

export abstract class LambdaHandlerFactory<TEvent, TResult, TController> {
  build(Module: Type, Controller: Type<TController>): MiddyfiedHandler<TEvent, TResult> {
    const getController = createNestController(Module, Controller);
    return this.createHandler(getController);
  }

  protected abstract createHandler(
    getController: () => Promise<TController>,
  ): MiddyfiedHandler<TEvent, TResult>;
}
