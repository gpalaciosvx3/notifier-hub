import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { MarkBatchFailedPermanentUseCase } from '../../application/use-cases/mark-batch-failed-permanent.usecase';
import { SqsEventParser } from '../../../worker/application/parsers/sqs.parser';
import { DlqController } from '../controller/dlq.controller';

@Module({
  providers: [
    DynamoClient,
    EnvValidationMiddleware,
    DlqController,
    SqsEventParser,
    MarkBatchFailedPermanentUseCase,
    { provide: NotificationDbRepository, useClass: NotificationDbRepositoryImpl },
  ],
})
export class DlqModule {}
