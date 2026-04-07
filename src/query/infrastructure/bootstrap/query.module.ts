import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationDbRepositoryImpl } from '../repository/notification.db.repository.impl';
import { GetNotificationUseCase } from '../../application/use-cases/get-notification.usecase';
import { QueryService } from '../../domain/service/query.service';
import { QueryController } from '../controller/query.controller';

@Module({
  providers: [
    DynamoClient,
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_QUERY),
    QueryController,
    QueryService,
    GetNotificationUseCase,
    { provide: NotificationDbRepository, useClass: NotificationDbRepositoryImpl },
  ],
})
export class QueryModule {}
