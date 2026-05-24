import 'reflect-metadata';
import { INestApplicationContext, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { LambdaLogger } from '../logger/lambda.logger';

export const createNestController = <TController>(
  Module: Type,
  Controller: Type<TController>,
) => {
  let app: INestApplicationContext | undefined;

  return async (): Promise<TController> => {
    if (!app) {
      app = await NestFactory.createApplicationContext(Module, {
        logger: new LambdaLogger('', { logLevels: ['log', 'warn', 'error'] }),
      });
    }
    return app.get(Controller);
  };
};
