import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { envConfig } from '../../../common/config/env.config';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { DlqBatchService } from '../../domain/service/dlq-batch.service';
import { MarkBatchFailedPermanentUseCase } from '../../application/use-cases/mark-batch-failed-permanent.usecase';
import { DlqController } from '../controller/dlq.controller';

@Module({
  providers: [
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_DLQ),
    {
      provide: NotificationDbRepository,
      useFactory: (dynamo: DynamoClient) =>
        new NotificationDbRepositoryImpl(dynamo, envConfig.notificationsTable),
      inject: [DynamoClient],
    },
    {
      provide: DlqBatchService,
      useFactory: (db: NotificationDbRepository) => new DlqBatchService(db),
      inject: [NotificationDbRepository],
    },
    {
      provide: MarkBatchFailedPermanentUseCase,
      useFactory: (svc: DlqBatchService) => new MarkBatchFailedPermanentUseCase(svc),
      inject: [DlqBatchService],
    },
    {
      provide: DlqController,
      useFactory: (uc: MarkBatchFailedPermanentUseCase) => new DlqController(uc),
      inject: [MarkBatchFailedPermanentUseCase],
    },
  ],
})
export class DlqModule {}
