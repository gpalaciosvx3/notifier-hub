import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationSenderRepository, SesSenderRepository, SnsSenderRepository } from '../../domain/repository/notification.sender.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { SesSenderRepositoryImpl } from '../repository/ses.sender.repository.impl';
import { SnsSenderRepositoryImpl } from '../repository/sns.sender.repository.impl';
import { ChannelRouterService } from '../../domain/service/channel-router.service';
import { ProcessBatchUseCase } from '../../application/use-cases/process-batch.usecase';
import { ProcessingService } from '../../domain/service/processing.service';
import { WorkerController } from '../controller/worker.controller';

@Module({
  providers: [
    DynamoClient,
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_WORKER),
    WorkerController,
    ProcessingService,
    ProcessBatchUseCase,
    { provide: NotificationDbRepository, useClass: NotificationDbRepositoryImpl },
    { provide: SesSenderRepository, useClass: SesSenderRepositoryImpl },
    { provide: SnsSenderRepository, useClass: SnsSenderRepositoryImpl },
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
  ],
})
export class WorkerModule {}
