import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationSqsRepository } from '../../domain/repository/notification.sqs.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { NotificationSqsRepositoryImpl } from '../repository/notification.sqs.repository.impl';
import { EnqueueNotificationUseCase } from '../../application/use-cases/enqueue-notification.usecase';
import { NotificationService } from '../../domain/service/notification.service';
import { EnqueueEventParser } from '../../application/parsers/enqueue.parser';
import { EnqueueController } from '../controller/enqueue.controller';

@Module({
  providers: [
    DynamoClient,
    EnvValidationMiddleware,
    EnqueueController,
    EnqueueEventParser,
    NotificationService,
    EnqueueNotificationUseCase,
    { provide: NotificationDbRepository, useClass: NotificationDbRepositoryImpl },
    { provide: NotificationSqsRepository, useClass: NotificationSqsRepositoryImpl },
  ],
})
export class EnqueueModule {}
