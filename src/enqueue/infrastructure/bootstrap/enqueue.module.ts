import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { SqsClient } from '../../../common/sqs/sqs.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationSqsRepository } from '../../domain/repository/notification.sqs.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { NotificationSqsRepositoryImpl } from '../repository/notification.sqs.repository.impl';
import { EnqueueNotificationUseCase } from '../../application/use-cases/enqueue-notification.usecase';
import { NotificationService } from '../../domain/service/notification.service';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { EnqueueController } from '../controller/enqueue.controller';

@Module({
  providers: [
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    { provide: SqsClient, useFactory: () => new SqsClient() },
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_ENQUEUE),
    {
      provide: NotificationDbRepository,
      useFactory: (dynamo: DynamoClient) =>
        new NotificationDbRepositoryImpl(dynamo, envConfig.notificationsTable),
      inject: [DynamoClient],
    },
    {
      provide: NotificationSqsRepository,
      useFactory: (sqs: SqsClient) => new NotificationSqsRepositoryImpl(sqs, envConfig.notificationsQueueUrl),
      inject: [SqsClient],
    },
    {
      provide: NotificationService,
      useFactory: (db: NotificationDbRepository, sqs: NotificationSqsRepository) =>
        new NotificationService(
          envConfig.defaultEmailProvider as NotificationProvider,
          envConfig.defaultSmsProvider as NotificationProvider,
          db,
          sqs,
        ),
      inject: [NotificationDbRepository, NotificationSqsRepository],
    },
    {
      provide: EnqueueNotificationUseCase,
      useFactory: (svc: NotificationService) => new EnqueueNotificationUseCase(svc),
      inject: [NotificationService],
    },
    {
      provide: EnqueueController,
      useFactory: (uc: EnqueueNotificationUseCase) => new EnqueueController(uc),
      inject: [EnqueueNotificationUseCase],
    },
  ],
})
export class EnqueueModule {}
