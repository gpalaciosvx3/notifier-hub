import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { EnqueueNotificationUseCase } from '../../application/use-cases/enqueue-notification.usecase';
import { EnqueueEventParser } from '../../application/parsers/enqueue.parser';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';

@Injectable()
export class EnqueueController {
  constructor(
    private readonly parser: EnqueueEventParser,
    private readonly useCase: EnqueueNotificationUseCase,
  ) {}

  async handle(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    try {
      const notificationId = await this.useCase.execute(this.parser.parse(event));
      return ApiGwHelper.exito(HttpStatus.ACCEPTED, { notificationId });
    } catch (error) {
      return ApiGwHelper.error(error);
    }
  }
}
