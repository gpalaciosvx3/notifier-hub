import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { DlqBatchService } from '../../domain/service/dlq-batch.service';
import { MarkBatchFailedPermanentUseCase } from '../../application/use-cases/mark-batch-failed-permanent.usecase';
import { DlqController } from '../controller/dlq.controller';

@Module({
  providers: [
    DynamoClient,
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_DLQ),
    DlqController,
    DlqBatchService,
    MarkBatchFailedPermanentUseCase,
    { provide: NotificationDbRepository, useClass: NotificationDbRepositoryImpl },
  ],
})
export class DlqModule {}
