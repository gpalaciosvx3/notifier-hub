import { MiddyfiedHandler } from '@middy/core';
import { Type } from '@nestjs/common';
import { requireEnvVarsMiddleware } from '../../middleware/env-validation.middleware';
import { createNestController } from '../nest-app.context';

export abstract class LambdaHandlerFactory<TEvent, TResult, TController> {
  build(
    Module: Type,
    Controller: Type<TController>,
    required: readonly string[],
  ): MiddyfiedHandler<TEvent, TResult> {
    const getController = createNestController(Module, Controller);
    const chain = this.createHandler(getController);
    chain.use(requireEnvVarsMiddleware<TEvent, TResult>(required));
    return chain;
  }

  protected abstract createHandler(
    getController: () => Promise<TController>,
  ): MiddyfiedHandler<TEvent, TResult>;
}
