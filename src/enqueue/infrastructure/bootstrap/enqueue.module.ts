import { Module } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/enqueue-notification.db.repository';
import { NotificationDbRepositoryImpl } from '../repository/enqueue-notification.db.repository.impl';
import { TemplateDbRepository } from '../../domain/repository/enqueue-template.db.repository';
import { TemplateDbRepositoryImpl } from '../repository/enqueue-template.db.repository.impl';
import { TemplateRenderService } from '../../domain/service/enqueue-template-render.service';
import { EnqueueNotificationUseCase } from '../../application/use-cases/enqueue-notification.usecase';
import { EnqueueNotificationService } from '../../domain/service/enqueue-notification.service';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { EnqueueController } from '../controller/enqueue.controller';

@Module({
  providers: [
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    {
      provide: NotificationDbRepository,
      useFactory: (dynamo: DynamoClient) =>
        new NotificationDbRepositoryImpl(
          dynamo,
          envConfig.notificationsTable,
          envConfig.outboxTable,
        ),
      inject: [DynamoClient],
    },
    {
      provide: TemplateDbRepository,
      useFactory: (dynamo: DynamoClient) =>
        new TemplateDbRepositoryImpl(dynamo, envConfig.templatesTable),
      inject: [DynamoClient],
    },
    {
      provide: EnqueueNotificationService,
      useFactory: (db: NotificationDbRepository, templateRepo: TemplateDbRepository) =>
        new EnqueueNotificationService(
          envConfig.defaultEmailProvider as NotificationProvider,
          envConfig.defaultSmsProvider as NotificationProvider,
          db,
          templateRepo,
          new TemplateRenderService(),
        ),
      inject: [NotificationDbRepository, TemplateDbRepository],
    },
    {
      provide: EnqueueNotificationUseCase,
      useFactory: (svc: EnqueueNotificationService) => new EnqueueNotificationUseCase(svc),
      inject: [EnqueueNotificationService],
    },
    {
      provide: EnqueueController,
      useFactory: (uc: EnqueueNotificationUseCase) => new EnqueueController(uc),
      inject: [EnqueueNotificationUseCase],
    },
  ],
})
export class EnqueueModule {}
