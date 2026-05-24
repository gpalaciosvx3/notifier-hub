import middy from '@middy/core';
import { Type } from '@nestjs/common';
import { DynamoDBBatchResponse } from 'aws-lambda';
import { parseDynamoStreamEventMiddleware, DynamoStreamHandlerEvent } from '../../middleware/lambda-event.middleware';
import { DynamoStreamBatchController } from '../interfaces/lambda-controller.interfaces';
import { LambdaHandlerFactory } from './lambda-handler.factory';

export class DynamoStreamHandlerFactory extends LambdaHandlerFactory<DynamoStreamHandlerEvent, DynamoDBBatchResponse, DynamoStreamBatchController> {
  protected createHandler(getController: () => Promise<DynamoStreamBatchController>) {
    return middy<DynamoStreamHandlerEvent, DynamoDBBatchResponse>(async (event) => {
      const ctrl = await getController();
      const results = await ctrl.handle(event.parsed);
      return {
        batchItemFailures: results.filter((r) => r.retry).map((r) => ({ itemIdentifier: r.sequenceNumber })),
      };
    }).use(parseDynamoStreamEventMiddleware());
  }
}
