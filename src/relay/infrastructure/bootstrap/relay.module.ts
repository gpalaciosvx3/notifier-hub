import { Module } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { SqsClient } from '../../../common/sqs/sqs.client';
import { envConfig } from '../../../common/config/env.config';
import { OutboxEventDbRepository } from '../../domain/repository/relay-outbox-event.db.repository';
import { NotificationQueueSqsRepository } from '../../domain/repository/relay-notification-queue.sqs.repository';
import { WebhookQueueSqsRepository } from '../../domain/repository/relay-webhook-queue.sqs.repository';
import { SchedulerRepository } from '../../domain/repository/relay-scheduler.repository';
import { OutboxEventDbRepositoryImpl } from '../repository/relay-outbox-event.db.repository.impl';
import { NotificationQueueSqsRepositoryImpl } from '../repository/relay-notification-queue.sqs.repository.impl';
import { WebhookQueueSqsRepositoryImpl } from '../repository/relay-webhook-queue.sqs.repository.impl';
import { SchedulerRepositoryImpl } from '../repository/relay-scheduler.repository.impl';
import { NotificationCreatedStrategy } from '../../domain/strategy/relay-notification-created.strategy';
import { NotificationScheduledStrategy } from '../../domain/strategy/relay-notification-scheduled.strategy';
import { WebhookRequestedStrategy } from '../../domain/strategy/relay-webhook-requested.strategy';
import { RelayService } from '../../domain/service/relay.service';
import { RelayEventUseCase } from '../../application/use-cases/relay-event.usecase';
import { RelayController } from '../controller/relay.controller';

@Module({
  providers: [
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    { provide: SqsClient, useFactory: () => new SqsClient() },
    {
      provide: OutboxEventDbRepository,
      useFactory: (dynamo: DynamoClient) =>
        new OutboxEventDbRepositoryImpl(dynamo, envConfig.outboxTable),
      inject: [DynamoClient],
    },
    {
      provide: NotificationQueueSqsRepository,
      useFactory: (sqs: SqsClient) =>
        new NotificationQueueSqsRepositoryImpl(sqs, envConfig.notificationsQueueUrl),
      inject: [SqsClient],
    },
    {
      provide: WebhookQueueSqsRepository,
      useFactory: (sqs: SqsClient) =>
        new WebhookQueueSqsRepositoryImpl(sqs, envConfig.webhooksQueueUrl),
      inject: [SqsClient],
    },
    { provide: SchedulerRepository, useFactory: () => new SchedulerRepositoryImpl() },
    {
      provide: NotificationCreatedStrategy,
      useFactory: (notifQueue: NotificationQueueSqsRepository) =>
        new NotificationCreatedStrategy(notifQueue),
      inject: [NotificationQueueSqsRepository],
    },
    {
      provide: NotificationScheduledStrategy,
      useFactory: (scheduler: SchedulerRepository) =>
        new NotificationScheduledStrategy(scheduler, envConfig.notificationsQueueUrl),
      inject: [SchedulerRepository],
    },
    {
      provide: WebhookRequestedStrategy,
      useFactory: (webhookQueue: WebhookQueueSqsRepository) =>
        new WebhookRequestedStrategy(webhookQueue),
      inject: [WebhookQueueSqsRepository],
    },
    {
      provide: RelayService,
      useFactory: (
        outboxDb: OutboxEventDbRepository,
        notificationCreated: NotificationCreatedStrategy,
        notificationScheduled: NotificationScheduledStrategy,
        webhookRequested: WebhookRequestedStrategy,
      ) => new RelayService(outboxDb, notificationCreated, notificationScheduled, webhookRequested),
      inject: [
        OutboxEventDbRepository,
        NotificationCreatedStrategy,
        NotificationScheduledStrategy,
        WebhookRequestedStrategy,
      ],
    },
    {
      provide: RelayEventUseCase,
      useFactory: (svc: RelayService) => new RelayEventUseCase(svc),
      inject: [RelayService],
    },
    {
      provide: RelayController,
      useFactory: (uc: RelayEventUseCase) => new RelayController(uc),
      inject: [RelayEventUseCase],
    },
  ],
})
export class RelayModule {}
