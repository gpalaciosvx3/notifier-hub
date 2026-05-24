import { Module } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { GetNotificationUseCase } from '../../application/use-cases/get-notification.usecase';
import { GetNotificationsByRecipientUseCase } from '../../application/use-cases/get-notifications-by-recipient.usecase';
import { QueryService } from '../../domain/service/query.service';
import { QueryController } from '../controller/query.controller';

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
      provide: QueryService,
      useFactory: (db: NotificationDbRepository) => new QueryService(db),
      inject: [NotificationDbRepository],
    },
    {
      provide: GetNotificationUseCase,
      useFactory: (svc: QueryService) => new GetNotificationUseCase(svc),
      inject: [QueryService],
    },
    {
      provide: GetNotificationsByRecipientUseCase,
      useFactory: (svc: QueryService) => new GetNotificationsByRecipientUseCase(svc),
      inject: [QueryService],
    },
    {
      provide: QueryController,
      useFactory: (uc: GetNotificationUseCase, ucr: GetNotificationsByRecipientUseCase) =>
        new QueryController(uc, ucr),
      inject: [GetNotificationUseCase, GetNotificationsByRecipientUseCase],
    },
  ],
})
export class QueryModule {}
