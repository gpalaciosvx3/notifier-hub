import { Injectable, HttpStatus } from '@nestjs/common';
import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { GetNotificationUseCase } from '../../application/use-cases/get-notification.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';

@Injectable()
export class QueryController {
  constructor(private readonly useCase: GetNotificationUseCase) {}

  async handle(event: ApiGwExtracted): Promise<APIGatewayProxyResultV2> {
    try {
      return ApiGwHelper.succes(HttpStatus.OK, await this.useCase.execute({
        id: event.pathParameters['id'],
        status: event.queryStringParameters['status'],
      }));
    } catch (error) {
      return ApiGwHelper.error(error);
    }
  }
}
