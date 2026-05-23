import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { CallbackHttpRepository } from '../../domain/repository/callback.http.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { CallbackHttpRepositoryImpl } from '../repository/callback.http.repository.impl';
import { DispatchService } from '../../domain/service/dispatch.service';
import { DispatchBatchUseCase } from '../../application/use-cases/dispatch-batch.usecase';
import { WebhookDispatcherController } from '../controller/webhook-dispatcher.controller';

@Module({
  providers: [
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_WEBHOOK_DISPATCHER),
    {
      provide: NotificationDbRepository,
      useFactory: (dynamo: DynamoClient) =>
        new NotificationDbRepositoryImpl(dynamo, envConfig.notificationsTable),
      inject: [DynamoClient],
    },
    {
      provide: CallbackHttpRepository,
      useFactory: () => new CallbackHttpRepositoryImpl(),
    },
    {
      provide: DispatchService,
      useFactory: (db: NotificationDbRepository, http: CallbackHttpRepository) =>
        new DispatchService(db, http),
      inject: [NotificationDbRepository, CallbackHttpRepository],
    },
    {
      provide: DispatchBatchUseCase,
      useFactory: (svc: DispatchService) => new DispatchBatchUseCase(svc),
      inject: [DispatchService],
    },
    {
      provide: WebhookDispatcherController,
      useFactory: (uc: DispatchBatchUseCase) => new WebhookDispatcherController(uc),
      inject: [DispatchBatchUseCase],
    },
  ],
})
export class WebhookDispatcherModule {}
