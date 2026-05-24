import { Module } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { SesClient } from '../../../common/ses/ses.client';
import { SnsClient } from '../../../common/sns/sns.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/sender-notification.db.repository';
import {
  SesSenderRepository,
  SnsSenderRepository,
} from '../../domain/repository/sender-channel.repository';
import { NotificationDbRepositoryImpl } from '../repository/sender-notification.db.repository.impl';
import { SesSenderRepositoryImpl } from '../repository/sender-ses-email.repository.impl';
import { SnsSenderRepositoryImpl } from '../repository/sender-sns-sms.repository.impl';
import { SesEmailStrategy } from '../../domain/strategy/sender-ses-email.strategy';
import { SnsSmsStrategy } from '../../domain/strategy/sender-sns-sms.strategy';
import { ProcessBatchUseCase } from '../../application/use-cases/sender.usecase';
import { ProcessingService } from '../../domain/service/sender.service';
import { SenderController } from '../controller/sender.controller';

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
      provide: SenderController,
      useFactory: (uc: ProcessBatchUseCase) => new SenderController(uc),
      inject: [ProcessBatchUseCase],
    },
  ],
})
export class SenderModule {}
