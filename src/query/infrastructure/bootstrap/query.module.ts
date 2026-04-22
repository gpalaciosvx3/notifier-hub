import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { GetNotificationUseCase } from '../../application/use-cases/get-notification.usecase';
import { QueryService } from '../../domain/service/query.service';
import { QueryController } from '../controller/query.controller';

@Module({
  providers: [
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_QUERY),
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
      provide: QueryController,
      useFactory: (uc: GetNotificationUseCase) => new QueryController(uc),
      inject: [GetNotificationUseCase],
    },
  ],
})
export class QueryModule {}
