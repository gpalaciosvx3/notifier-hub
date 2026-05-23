import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { TemplateDbRepository } from '../../domain/repository/template.db.repository';
import { TemplateDbRepositoryImpl } from '../repository/template.db.repository.impl';
import { TemplateRenderService } from '../../domain/service/template.render.service';
import { EnqueueNotificationUseCase } from '../../application/use-cases/enqueue-notification.usecase';
import { NotificationService } from '../../domain/service/notification.service';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { EnqueueController } from '../controller/enqueue.controller';

@Module({
  providers: [
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_ENQUEUE),
    {
      provide: NotificationDbRepository,
      useFactory: (dynamo: DynamoClient) =>
        new NotificationDbRepositoryImpl(dynamo, envConfig.notificationsTable, envConfig.outboxTable),
      inject: [DynamoClient],
    },
    {
      provide: TemplateDbRepository,
      useFactory: (dynamo: DynamoClient) =>
        new TemplateDbRepositoryImpl(dynamo, envConfig.templatesTable),
      inject: [DynamoClient],
    },
    {
      provide: NotificationService,
      useFactory: (db: NotificationDbRepository) =>
        new NotificationService(
          envConfig.defaultEmailProvider as NotificationProvider,
          envConfig.defaultSmsProvider as NotificationProvider,
          db,
        ),
      inject: [NotificationDbRepository],
    },
    {
      provide: EnqueueNotificationUseCase,
      useFactory: (svc: NotificationService, templateRepo: TemplateDbRepository) =>
        new EnqueueNotificationUseCase(svc, templateRepo, new TemplateRenderService()),
      inject: [NotificationService, TemplateDbRepository],
    },
    {
      provide: EnqueueController,
      useFactory: (uc: EnqueueNotificationUseCase) => new EnqueueController(uc),
      inject: [EnqueueNotificationUseCase],
    },
  ],
})
export class EnqueueModule {}

