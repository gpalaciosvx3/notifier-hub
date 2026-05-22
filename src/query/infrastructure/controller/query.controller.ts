import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { GetNotificationUseCase } from '../../application/use-cases/get-notification.usecase';
import { GetNotificationsByRecipientUseCase } from '../../application/use-cases/get-notifications-by-recipient.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(
    private readonly useCase: GetNotificationUseCase,
    private readonly byRecipientUseCase: GetNotificationsByRecipientUseCase,
  ) {}

  @HandleExecution('QUERY')  
  async handle(event: ApiGwExtracted): Promise<APIGatewayProxyResult> {
    try {
      if (event.queryStringParameters['to']) {
        return ApiGwHelper.success(HttpStatus.OK, await this.byRecipientUseCase.execute({
          to: event.queryStringParameters['to'],
          pageToken: event.queryStringParameters['pageToken'],
        }));
      }
      return ApiGwHelper.success(HttpStatus.OK, await this.useCase.execute({
        id: event.pathParameters['id'],
        status: event.queryStringParameters['status'],
      }));
    } catch (error) {
      this.logger.error('Error obteniendo notificación', error);
      return ApiGwHelper.error(error);
    }
  }
}
