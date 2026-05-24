import { MiddlewareObj } from '@middy/core';
import { APIGatewayProxyResult } from 'aws-lambda';
import { EnqueueHandlerEvent } from './types/lambda-event.types';
import { ApiGwHelper } from '../helpers/api-gw.helper';
import { CustomException } from '../errors/custom.exception';
import { ErrorDictionary } from '../errors/error.dictionary';

export const requireIdempotencyKeyMiddleware = (): MiddlewareObj<
  EnqueueHandlerEvent,
  APIGatewayProxyResult
> => ({
  before: (request) => {
    const key = request.event.parsed.headers['x-idempotency-key'];
    if (!key) {
      request.response = ApiGwHelper.error(
        new CustomException(ErrorDictionary.MISSING_IDEMPOTENCY_KEY),
      );
      return;
    }
    request.event.idempotencyKey = key;
  },
});
