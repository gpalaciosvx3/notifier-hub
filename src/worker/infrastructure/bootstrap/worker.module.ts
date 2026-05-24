import { Module } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { SesClient } from '../../../common/ses/ses.client';
import { SnsClient } from '../../../common/sns/sns.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/worker-notification.db.repository';
import {
  SesSenderRepository,
  SnsSenderRepository,
} from '../../domain/repository/worker-notification-sender.repository';
import { NotificationDbRepositoryImpl } from '../repository/worker-notification.db.repository.impl';
import { SesSenderRepositoryImpl } from '../repository/worker-ses-email.sender.repository.impl';
import { SnsSenderRepositoryImpl } from '../repository/worker-sns-sms.sender.repository.impl';
import { SesEmailStrategy } from '../../domain/strategy/worker-ses-email.strategy';
import { SnsSmsStrategy } from '../../domain/strategy/worker-sns-sms.strategy';
import { ProcessBatchUseCase } from '../../application/use-cases/worker.usecase';
import { ProcessingService } from '../../domain/service/worker.service';
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
      provide: SesEmailStrategy,
      useFactory: (ses: SesSenderRepository) => new SesEmailStrategy(ses),
      inject: [SesSenderRepository],
    },
    {
      provide: SnsSmsStrategy,
      useFactory: (sns: SnsSenderRepository) => new SnsSmsStrategy(sns),
      inject: [SnsSenderRepository],
    },
    {
      provide: ProcessingService,
      useFactory: (db: NotificationDbRepository, ses: SesEmailStrategy, sns: SnsSmsStrategy) =>
        new ProcessingService(db, ses, sns),
      inject: [NotificationDbRepository, SesEmailStrategy, SnsSmsStrategy],
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
