import { Module } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { SesClient } from '../../../common/ses/ses.client';
import { SnsClient } from '../../../common/sns/sns.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import {
  NotificationSenderRepository,
  SesSenderRepository,
  SnsSenderRepository,
} from '../../domain/repository/notification.sender.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { SesSenderRepositoryImpl } from '../repository/ses.sender.repository.impl';
import { SnsSenderRepositoryImpl } from '../repository/sns.sender.repository.impl';
import { ChannelRouterService } from '../../domain/service/channel-router.service';
import { ProcessBatchUseCase } from '../../application/use-cases/process-batch.usecase';
import { ProcessingService } from '../../domain/service/processing.service';
import { WorkerController } from '../controller/worker.controller';

@Module({
  providers: [
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    { provide: SesClient, useFactory: () => new SesClient() },
    { provide: SnsClient, useFactory: () => new SnsClient() },
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
      provide: SesSenderRepository,
      useFactory: (ses: SesClient) => new SesSenderRepositoryImpl(ses, envConfig.sesSourceEmail),
      inject: [SesClient],
    },
    {
      provide: SnsSenderRepository,
      useFactory: (sns: SnsClient) => new SnsSenderRepositoryImpl(sns),
      inject: [SnsClient],
    },
    {
      provide: ChannelRouterService,
      useFactory: (ses: SesSenderRepository, sns: SnsSenderRepository) => {
        const remitentes = new Map<string, NotificationSenderRepository>([
          [`${NotificationChannel.EMAIL}:${NotificationProvider.SES}`, ses],
          [`${NotificationChannel.SMS}:${NotificationProvider.SNS}`, sns],
        ]);
        return new ChannelRouterService(remitentes);
      },
      inject: [SesSenderRepository, SnsSenderRepository],
    },
    {
      provide: ProcessingService,
      useFactory: (db: NotificationDbRepository, router: ChannelRouterService) =>
        new ProcessingService(db, router),
      inject: [NotificationDbRepository, ChannelRouterService],
    },
    {
      provide: ProcessBatchUseCase,
      useFactory: (svc: ProcessingService) => new ProcessBatchUseCase(svc),
      inject: [ProcessingService],
    },
    {
      provide: WorkerController,
      useFactory: (uc: ProcessBatchUseCase) => new WorkerController(uc),
      inject: [ProcessBatchUseCase],
    },
  ],
})
export class WorkerModule {}
