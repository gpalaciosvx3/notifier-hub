import { Module } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/webhook-dispatcher-notification.db.repository';
import { CallbackHttpRepository } from '../../domain/repository/webhook-dispatcher-callback.http.repository';
import { NotificationDbRepositoryImpl } from '../repository/webhook-dispatcher-notification.db.repository.impl';
import { CallbackHttpRepositoryImpl } from '../repository/webhook-dispatcher-callback.http.repository.impl';
import { DispatchService } from '../../domain/service/webhook-dispatcher.service';
import { DispatchBatchUseCase } from '../../application/use-cases/webhook-dispatcher.usecase';
import { WebhookDispatcherController } from '../controller/webhook-dispatcher.controller';

@Module({
  providers: [
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
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
