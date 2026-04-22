import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { EnqueueNotificationUseCase } from '../../application/use-cases/enqueue-notification.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class EnqueueController {
  private readonly logger = new Logger(EnqueueController.name);

  constructor(private readonly useCase: EnqueueNotificationUseCase) {}

  @HandleExecution('ENQUEUE_NOTIFICATION')
  async handle(event: ApiGwExtracted): Promise<APIGatewayProxyResult> {
    try {
      const notificationId = await this.useCase.execute(event.body);
      return ApiGwHelper.success(HttpStatus.ACCEPTED, { notificationId });
    } catch (error) {
      this.logger.error('Error encolando notificación', error);
      return ApiGwHelper.error(error);
    }
  }
}
