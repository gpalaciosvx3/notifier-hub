import { Injectable, HttpStatus } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { EnqueueNotificationUseCase } from '../../application/use-cases/enqueue-notification.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class EnqueueController {
  constructor(private readonly useCase: EnqueueNotificationUseCase) {}

  @HandleExecution('EnqueueNotification', ApiGwHelper.error)
  async handle(body: unknown, idempotencyKey: string): Promise<APIGatewayProxyResult> {
    return ApiGwHelper.success(HttpStatus.ACCEPTED, await this.useCase.execute(body, idempotencyKey));
  }
}
