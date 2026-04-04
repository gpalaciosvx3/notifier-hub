import { Injectable, HttpStatus } from '@nestjs/common';
import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { EnqueueNotificationUseCase } from '../../application/use-cases/enqueue-notification.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';

@Injectable()
export class EnqueueController {
  constructor(private readonly useCase: EnqueueNotificationUseCase) {}

  async handle(event: ApiGwExtracted): Promise<APIGatewayProxyResultV2> {
    try {
      const notificationId = await this.useCase.execute(event.body);
      return ApiGwHelper.succes(HttpStatus.ACCEPTED, { notificationId });
    } catch (error) {
      return ApiGwHelper.error(error);
    }
  }
}
