import 'reflect-metadata';
import { INestApplicationContext, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { LambdaLogger } from '../logger/lambda.logger';

export const createLambdaHandler = <TController, TEvent, TResponse>(
  Module: Type,
  Controller: Type<TController>,
  execute: (controller: TController, event: TEvent) => Promise<TResponse>,
) => {
  let app: INestApplicationContext | undefined;

  return async (event: TEvent): Promise<TResponse> => {
    if (!app) {
      app = await NestFactory.createApplicationContext(Module, {
        logger: new LambdaLogger('', { logLevels: ['log', 'warn', 'error'] }),
      });
    }
    const controller = app.get(Controller);
    return execute(controller, event);
  };
};
