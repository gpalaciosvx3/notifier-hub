import middy from '@middy/core';
import { Type } from '@nestjs/common';
import { SQSBatchResponse } from 'aws-lambda';
import { parseSqsEventMiddleware, SqsHandlerEvent } from '../../middleware/lambda-event.middleware';
import { SqsBatchController } from '../interfaces/lambda-controller.interfaces';
import { createNestController } from './nest-context.factory';

export const createSqsHandler = (Module: Type, Controller: Type<SqsBatchController>) => {
  const getController = createNestController(Module, Controller);
  return middy<SqsHandlerEvent, SQSBatchResponse>(async (event) => {
    const ctrl = await getController();
    const results = await ctrl.handle(event.parsed);
    return {
      batchItemFailures: results.filter((r) => r.retry).map((r) => ({ itemIdentifier: r.sequenceNumber })),
    };
  }).use(parseSqsEventMiddleware());
};
