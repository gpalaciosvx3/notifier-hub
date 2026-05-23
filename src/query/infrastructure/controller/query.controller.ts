import { Injectable, HttpStatus } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { GetNotificationUseCase } from '../../application/use-cases/get-notification.usecase';
import { GetNotificationsByRecipientUseCase } from '../../application/use-cases/get-notifications-by-recipient.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class QueryController {
  constructor(
    private readonly useCase: GetNotificationUseCase,
    private readonly byRecipientUseCase: GetNotificationsByRecipientUseCase,
  ) {}

  @HandleExecution('QueryNotification', ApiGwHelper.error)
  async handle(event: ApiGwExtracted): Promise<APIGatewayProxyResult> {
    if (event.queryStringParameters.to) {
      return ApiGwHelper.success(
        HttpStatus.OK,
        await this.byRecipientUseCase.execute(event.queryStringParameters),
      );
    }
    return ApiGwHelper.success(
      HttpStatus.OK,
      await this.useCase.execute({ ...event.pathParameters, ...event.queryStringParameters }),
    );
  }
}
