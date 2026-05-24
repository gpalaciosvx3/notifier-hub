import { Injectable, HttpStatus } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { EnqueueNotificationUseCase } from '../../application/use-cases/enqueue-notification.usecase';
import { IdempotencyMiddleware } from '../../../common/middleware/idempotency.middleware';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class EnqueueController {
  constructor(
    private readonly useCase: EnqueueNotificationUseCase,
    private readonly idempotency: IdempotencyMiddleware,
  ) {}

  @HandleExecution('EnqueueNotification', ApiGwHelper.error)
  async handle(body: unknown, idempotencyKey?: string): Promise<APIGatewayProxyResult> {
    const cached = await this.idempotency.check(idempotencyKey);
    if (cached) return ApiGwHelper.success(HttpStatus.ACCEPTED, cached);
    return ApiGwHelper.success(HttpStatus.ACCEPTED, await this.useCase.execute(body, idempotencyKey));
  }
}
